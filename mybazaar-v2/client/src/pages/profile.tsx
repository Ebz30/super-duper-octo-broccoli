import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Building2, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  university: z.string().min(2, 'University is required').max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      university: user?.university || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  // Update profile mutation (placeholder - would need backend endpoint)
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // Placeholder - would call actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast({
        variant: 'success',
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update profile',
      });
    },
  });

  // Change password mutation (placeholder)
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      // Placeholder - would call actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      resetPassword();
      toast({
        variant: 'success',
        title: 'Password changed',
        description: 'Your password has been updated successfully',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not change password',
      });
    },
  });

  const onSubmitProfile = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your current account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{user?.fullName}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Member since {new Date(user?.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-gray-500">University</p>
                    <p className="text-sm font-medium text-gray-900">{user?.university}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    {...registerProfile('fullName')}
                    placeholder="Your full name"
                  />
                  {profileErrors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{profileErrors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    {...registerProfile('university')}
                    placeholder="Your university"
                  />
                  {profileErrors.university && (
                    <p className="text-sm text-red-500 mt-1">{profileErrors.university.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword')}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword('newPassword')}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerPassword('confirmPassword')}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  variant="outline"
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Your activity on MyBazaar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <p className="text-3xl font-bold text-teal-600">0</p>
                  <p className="text-sm text-gray-600 mt-1">Active Listings</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">0</p>
                  <p className="text-sm text-gray-600 mt-1">Total Views</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-gray-600 mt-1">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
