'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  Session, 
  User, 
  SupabaseClient, 
  AuthTokenResponse 
} from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
  }>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ 
    data: { user: User | null } | null; 
    error: Error | null;
  }>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isSubscriber: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface SubscriptionPayload {
  new: {
    user_id: string;
    [key: string]: any;
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const checkSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) {
        // If subscriptions table doesn't exist, assume no subscription
        if (error.code === '42P01' || error.message?.includes('relation "subscriptions" does not exist')) {
          console.log("AuthContext - Subscriptions table doesn't exist, assuming no subscription");
          setIsSubscriber(false);
          return;
        }
        
        // If user_id column doesn't exist, try with auth_id
        if (error.code === '42703' || error.message?.includes('column subscriptions.user_id does not exist')) {
          console.log("AuthContext - user_id column doesn't exist, trying auth_id");
          try {
            const { data: altData, error: altError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('auth_id', userId)
              .in('status', ['active', 'trialing'])
              .order('created_at', { ascending: false })
              .maybeSingle();
            
            if (altError) {
              console.log("AuthContext - auth_id also failed, assuming no subscription");
              setIsSubscriber(false);
              return;
            }
            
            const isValid = altData && 
              ['active', 'trialing'].includes(altData.status) && 
              new Date(altData.current_period_end) > new Date();
            setIsSubscriber(!!isValid);
            console.log("AuthContext - set isSubscriber via auth_id:", !!isValid);
            return;
          } catch (altErr) {
            console.log("AuthContext - Alternative subscription check failed, assuming no subscription");
            setIsSubscriber(false);
            return;
          }
        }
        
        console.log('AuthContext - Subscription check error, assuming no subscription:', error.message);
        setIsSubscriber(false);
        return;
      }

      const isValid = data && 
        ['active', 'trialing'].includes(data.status) && 
        new Date(data.current_period_end) > new Date();

      setIsSubscriber(!!isValid);
      console.log("AuthContext - set isSubscriber:", !!isValid);
    } catch (error) {
      console.log('AuthContext - Subscription check failed, assuming no subscription:', error);
      setIsSubscriber(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log("AuthContext - mounted useEffect:", mounted);
    
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("AuthContext - Starting initialization with profile verification!");

        // First, get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !mounted) {
          setIsLoading(false);
          return;
        }

        setSession(session);
        const currentUser = session?.user ?? null;
        
        console.log("AuthContext - Current user:", currentUser);
        
        if (currentUser) {
          // Check if user has a profile (our verification method)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', currentUser.id)
            .single();
          
          console.log("AuthContext - Profile check:", { profile, profileError });
          
          // If profiles table doesn't exist, fall back to email verification
          if (profileError?.code === '42P01' || profileError?.message?.includes('relation "profiles" does not exist') || !profileError?.code) {
            console.log("AuthContext - Profiles table doesn't exist, using email verification fallback");
            if (currentUser.email_confirmed_at || process.env.NODE_ENV === 'development') {
              console.log("AuthContext - User has confirmed email or in development, setting as authenticated");
              setUser(currentUser);
              setIsEmailVerified(true);
              await checkSubscription(currentUser.id);
            } else {
              console.log("AuthContext - User email not confirmed");
              setUser(null);
              setIsEmailVerified(false);
              setIsSubscriber(false);
            }
          } else if (profile && !profileError) {
            console.log("AuthContext - User has verified profile, setting as authenticated");
            setUser(currentUser);
            setIsEmailVerified(true);
            await checkSubscription(currentUser.id);
          } else {
            console.log("AuthContext - User doesn't have profile, needs verification");
            setUser(null);
            setIsEmailVerified(false);
            setIsSubscriber(false);
          }
        } else {
          console.log("AuthContext - No current user");
          setUser(null);
          setIsEmailVerified(false);
          setIsSubscriber(false);
        }
        
        // Then set up listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            if (!mounted) return;
            
            console.log("AuthContext - Auth state change event:", _event);
            const newUser = newSession?.user ?? null;
            console.log("AuthContext - New user:", newUser);
            
            setSession(newSession);
            
            if (newUser) {
              // Check if user has a profile
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_id', newUser.id)
                .single();
              
              // If profiles table doesn't exist OR any error, fall back to email verification
              if (profileError?.code === '42P01' || profileError?.message?.includes('relation "profiles" does not exist') || !profileError?.code) {
                console.log("AuthContext - Profiles table doesn't exist, using email verification fallback");
                if (newUser.email_confirmed_at || process.env.NODE_ENV === 'development') {
                  console.log("AuthContext - New user has confirmed email or in development, setting as authenticated");
                  setUser(newUser);
                  setIsEmailVerified(true);
                  await checkSubscription(newUser.id);
                } else {
                  console.log("AuthContext - New user email not confirmed");
                  setUser(null);
                  setIsEmailVerified(false);
                  setIsSubscriber(false);
                }
              } else if (profile && !profileError) {
                console.log("AuthContext - New user has verified profile, setting as authenticated");
                setUser(newUser);
                setIsEmailVerified(true);
                await checkSubscription(newUser.id);
              } else {
                console.log("AuthContext - New user doesn't have profile, needs verification");
                setUser(null);
                setIsEmailVerified(false);
                setIsSubscriber(false);
              }
            } else {
              console.log("AuthContext - No new user");
              setUser(null);
              setIsEmailVerified(false);
              setIsSubscriber(false);
            }
          }
        );

        // Only set loading to false after everything is initialized
        if (mounted) setIsLoading(false);
        
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();
  }, [checkSubscription]);

  const value = {
    user,
    session,
    isLoading,
    supabase,
    isEmailVerified,
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
    },
    signInWithEmail: async (email: string, password: string) => {
      console.log("AuthContext - Attempting sign in for:", email);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.log("AuthContext - Sign in error:", authError);
        throw authError;
      }

      console.log("AuthContext - Sign in successful, user:", authData.user);

      if (authData.user) {
        // Check if user has a profile (our verification method)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', authData.user.id)
          .single();

        // If profiles table doesn't exist OR any error, fall back to email verification
        if (profileError?.code === '42P01' || profileError?.message?.includes('relation "profiles" does not exist') || !profileError?.code) {
          console.log("AuthContext - Profiles table doesn't exist, using email verification fallback");
          if (!authData.user.email_confirmed_at && process.env.NODE_ENV !== 'development') {
            console.log("AuthContext - Email not verified, signing out user");
            await supabase.auth.signOut();
            throw new Error('Please verify your email address before signing in. Check your email for a verification link.');
          }
          console.log("AuthContext - User verified via email or development mode, proceeding with sign in");
        } else if (!profile || profileError) {
          console.log("AuthContext - User doesn't have profile, signing out");
          await supabase.auth.signOut();
          throw new Error('Please complete your signup process. Check your email for verification instructions.');
        } else {
          console.log("AuthContext - User verified via profile, proceeding with sign in");
        }
      }

      return authData;
    },
    signOut: async () => {
      try {
        // First cleanup all active connections/states
        window.dispatchEvent(new Event('cleanup-before-logout'));
        
        // Wait a small amount of time for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then perform the actual signout
        await supabase.auth.signOut();
        
        // Force redirect to login
        window.location.assign('/login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      return { data, error };
    },
    updatePassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    },
    updateEmail: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      if (error) throw error;
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });
      if (error) throw error;
    },
    deleteAccount: async () => {
      // First delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('auth_id', user?.id);
      
      if (profileError) throw profileError;

      // Then delete the user's subscription if it exists
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user?.id);

      if (subscriptionError) throw subscriptionError;

      // Finally delete the user's auth account
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user?.id as string
      );

      if (authError) throw authError;

      // Sign out after successful deletion
      await supabase.auth.signOut();
    },
    isSubscriber,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 