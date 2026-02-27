import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Force loading to false after 3 seconds no matter what
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).then(() => {
          setLoading(false);
          clearTimeout(timeout);
        });
      } else {
        setLoading(false);
        clearTimeout(timeout);
      }
    }).catch(() => {
      setLoading(false);
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) setProfile(data);
    } catch (err) {
      console.error('fetchProfile error:', err);
    }
  }

  async function signUp(email, password, username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return { error: { message: 'Username already taken' } };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { data, error };
    if (!data?.user) return { data, error: { message: 'Signup failed' } };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: username.trim(),
        display_name: username.trim()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return { data, error: { message: 'Account created but profile setup failed. Try logging in.' } };
    }

    await fetchProfile(data.user.id);
    return { data, error: null };
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) await fetchProfile(data.user.id);
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}