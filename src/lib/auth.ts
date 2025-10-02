import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from './supabase'
import { validateEmail, validatePassword, generateSessionToken } from './utils'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const SESSION_EXPIRY_DAYS = 7

export interface AuthUser {
  id: string
  email: string
  name: string
  university?: string
  phone?: string
  bio?: string
  profile_picture?: string
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  name: string
  university?: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  sessionToken?: string
  error?: string
}

export class AuthService {
  // Register new user
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Validate input
      if (!validateEmail(data.email)) {
        return { success: false, error: 'Invalid email format' }
      }

      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors[0] }
      }

      if (!data.name || data.name.trim().length < 2) {
        return { success: false, error: 'Name must be at least 2 characters' }
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single()

      if (existingUser) {
        return { success: false, error: 'User already exists with this email' }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10)

      // Create user
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          name: data.name.trim(),
          university: data.university?.trim() || null,
        })
        .select('id, email, name, university, created_at')
        .single()

      if (error) {
        console.error('Registration error:', error)
        return { success: false, error: 'Failed to create account' }
      }

      // Create session
      const sessionToken = generateSessionToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

      await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id: newUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        })

      return {
        success: true,
        user: newUser,
        sessionToken,
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!validateEmail(credentials.email)) {
        return { success: false, error: 'Invalid email format' }
      }

      if (!credentials.password) {
        return { success: false, error: 'Password is required' }
      }

      // Check for too many failed attempts
      const recentAttempts = await supabaseAdmin
        .from('failed_login_attempts')
        .select('id')
        .eq('email', credentials.email.toLowerCase())
        .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes

      if (recentAttempts.data && recentAttempts.data.length >= 5) {
        return { success: false, error: 'Too many failed attempts. Please try again in 15 minutes.' }
      }

      // Get user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, university, phone, bio, profile_picture, password_hash, is_banned, created_at')
        .eq('email', credentials.email.toLowerCase())
        .single()

      if (error || !user) {
        // Record failed attempt
        await this.recordFailedAttempt(credentials.email)
        return { success: false, error: 'Invalid email or password' }
      }

      // Check if user is banned
      if (user.is_banned) {
        return { success: false, error: 'Account has been suspended. Please contact support.' }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
      if (!isValidPassword) {
        // Record failed attempt
        await this.recordFailedAttempt(credentials.email)
        return { success: false, error: 'Invalid email or password' }
      }

      // Create session
      const sessionToken = generateSessionToken()
      const expiresAt = new Date()
      const sessionDays = credentials.rememberMe ? 30 : SESSION_EXPIRY_DAYS
      expiresAt.setDate(expiresAt.getDate() + sessionDays)

      await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        })

      // Remove password_hash from response
      const { password_hash, is_banned, ...userResponse } = user

      return {
        success: true,
        user: userResponse,
        sessionToken,
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Verify session token
  static async verifySession(sessionToken: string): Promise<AuthUser | null> {
    try {
      if (!sessionToken) return null

      const { data: session, error } = await supabaseAdmin
        .from('user_sessions')
        .select(`
          user_id,
          expires_at,
          users (
            id,
            email,
            name,
            university,
            phone,
            bio,
            profile_picture,
            is_banned,
            created_at
          )
        `)
        .eq('session_token', sessionToken)
        .single()

      if (error || !session) return null

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        // Clean up expired session
        await supabaseAdmin
          .from('user_sessions')
          .delete()
          .eq('session_token', sessionToken)
        return null
      }

      const user = session.users as any
      if (!user || user.is_banned) return null

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        university: user.university,
        phone: user.phone,
        bio: user.bio,
        profile_picture: user.profile_picture,
        created_at: user.created_at,
      }
    } catch (error) {
      console.error('Session verification error:', error)
      return null
    }
  }

  // Logout user
  static async logout(sessionToken: string): Promise<boolean> {
    try {
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<AuthUser, 'name' | 'university' | 'phone' | 'bio'>>
  ): Promise<AuthResult> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, email, name, university, phone, bio, profile_picture, created_at')
        .single()

      if (error) {
        return { success: false, error: 'Failed to update profile' }
      }

      return { success: true, user }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Record failed login attempt
  private static async recordFailedAttempt(email: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('failed_login_attempts')
        .insert({
          email: email.toLowerCase(),
          attempted_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Failed to record login attempt:', error)
    }
  }

  // Clean up expired sessions (utility function)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('Session cleanup error:', error)
    }
  }
}