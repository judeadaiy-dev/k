import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { View, ActivityIndicator } from 'react-native';

const supabase = createClient(
  'https://jmsmrojtlstppnpwmkkk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptc21yb2p0bHN0cHBucHdta2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTg2NDAsImV4cCI6MjA4ODM5NDY0MH0.j7gxr5CvrfvbJJzK_pMwVHiCE2AqpXUTThpeLEBmsos'
);

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function useProtectedRoute(session, loading) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session &&!inAuthGroup) router.replace('/(auth)/welcome');
    else if (session && inAuthGroup) router.replace('/rooms');
  }, [session, loading, segments]);
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useProtectedRoute(session, loading);

  if (loading) {
    return <View style={{flex: 1, justifyContent: 'center', backgroundColor: '#0F172A'}}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return <AuthContext.Provider value={{ session, supabase }}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="rooms" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
    </AuthProvider>
  );
    }
