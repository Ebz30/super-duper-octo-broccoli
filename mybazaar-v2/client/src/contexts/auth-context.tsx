import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/services/api';
import type { User, RegisterFormData, LoginFormData } from '@shared/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await apiService.auth.getMe();
        return response.data.user;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiService.auth.login(data);
      return response.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      toast({
        variant: 'success',
        title: 'Welcome back!',
        description: `Logged in as ${user.fullName}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid credentials',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiService.auth.register(data);
      return response.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      toast({
        variant: 'success',
        title: 'Account created!',
        description: `Welcome to MyBazaar, ${user.fullName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.response?.data?.message || 'Could not create account',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiService.auth.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
    },
  });

  const value: AuthContextType = {
    user: userData || null,
    isAuthenticated: !!userData,
    isLoading,
    login: async (data) => {
      await loginMutation.mutateAsync(data);
    },
    register: async (data) => {
      await registerMutation.mutateAsync(data);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
