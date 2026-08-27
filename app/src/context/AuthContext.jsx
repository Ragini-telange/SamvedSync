import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // { id, name, username, role, nurseStatus, nurseRecord }
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to load profile:', error.message);
      setProfile(null);
      return null;
    }

    let extendedProfile = { ...profileData };

    if (profileData.role === 'nurse') {
      const { data: nurseData } = await supabase
        .from('nurses')
        .select('*')
        .eq('profile_id', userId)
        .single();

      if (nurseData) {
        extendedProfile.nurseStatus = nurseData.status || 'approved';
        extendedProfile.nurseRecord = nurseData;
      } else {
        extendedProfile.nurseStatus = 'approved';
      }
    }

    setProfile(extendedProfile);
    return extendedProfile;
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) await loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const loadedProfile = await loadProfile(data.user.id);
    if (!loadedProfile) throw new Error('Login succeeded but no profile found for this account. Contact your admin.');
    
    return loadedProfile;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
