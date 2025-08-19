import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google OAuth flow...');
      console.log('Current URL:', window.location.href);
      console.log('Current Origin:', window.location.origin);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: undefined // Remove domain hint to allow any Google account
          },
          skipBrowserRedirect: false
        }
      });
      
      if (error) {
        console.error('❌ Supabase OAuth Error:', error);
        throw error;
      }
      
      console.log('✅ OAuth request initiated successfully');
      return { error: null };
    } catch (error) {
      console.error('💥 Google Sign-in Error:', error);
      return { 
        error: {
          message: error instanceof Error ? error.message : 'Google sign-in failed',
          details: error
        }
      };
    }
  };

  // Handle OAuth callback and session recovery
  const handleOAuthCallback = async () => {
    try {
      console.log('🔄 Handling OAuth callback...');
      console.log('Current URL:', window.location.href);
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (error) {
        console.error('❌ OAuth callback error:', error, errorDescription);
        return { error: { message: errorDescription || error } };
      }
      
      if (code) {
        console.log('✅ OAuth code received:', code);
        // Supabase should automatically handle the code exchange
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          return { error: sessionError };
        }
        
        console.log('✅ Session data:', data);
        return { error: null, session: data.session };
      }
      
      return { error: null };
    } catch (error) {
      console.error('💥 OAuth callback error:', error);
      return { 
        error: {
          message: error instanceof Error ? error.message : 'OAuth callback failed',
          details: error
        }
      };
    }
  };

  // Check for OAuth callback on component mount
  useEffect(() => {
    const checkOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (code || error) {
        console.log('🔍 OAuth callback detected in URL');
        const result = await handleOAuthCallback();
        
        if (result.error) {
          console.error('OAuth callback failed:', result.error);
        } else {
          console.log('OAuth callback successful');
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      }
    };
    
    checkOAuthCallback();
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    handleOAuthCallback
  };
      
      if (error) {
        console.error('Google OAuth Error:', error);
        throw error;
      }
      
      console.log('Google OAuth initiated successfully with redirect:', redirectUrl);
      return { error };
    } catch (error) {
      console.error('Google Sign-in Error:', error);
      return { 
        error: {
          message: error instanceof Error ? error.message : 'Google sign-in failed',
          details: error
        }
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword
  };
};