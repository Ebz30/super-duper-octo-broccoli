import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from './supabase';
import { User, Session } from './types';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Password validation
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userId: string, expiresIn: string = '7d'): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

// Verify JWT token
export function verifyToken(token: string): { userId?: string; error?: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { userId: decoded.userId };
  } catch (error) {
    return { error: 'Invalid token' };
  }
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  name: string,
  university?: string,
  phone?: string
): Promise<AuthResult> {
  try {
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        university,
        phone,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Failed to create user' };
    }

    // Generate token
    const token = generateToken(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword as User,
      token,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

// Login user
export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResult> {
  try {
    // Get user with password hash
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_banned', false)
      .single();

    if (error || !user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Generate token
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = generateToken(user.id, expiresIn);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword as User,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Get user by token
export async function getUserByToken(token: string): Promise<User | null> {
  try {
    // Verify token
    const { userId, error } = verifyToken(token);
    if (error || !userId) {
      return null;
    }

    // Check if session exists and is valid
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('token', token)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return null;
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_banned', false)
      .single();

    if (!user) {
      return null;
    }

    // Remove password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Get user by token error:', error);
    return null;
  }
}

// Logout user
export async function logoutUser(token: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('token', token);

    return !error;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await supabaseAdmin
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch (error) {
    console.error('Cleanup sessions error:', error);
  }
}

// Middleware for protected routes
export async function authenticateRequest(request: Request): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return await getUserByToken(token);
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}