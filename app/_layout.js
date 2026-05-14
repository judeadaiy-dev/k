import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. Supabase
const supabase = createClient(
  'https://jmsmrojtlstppnpwmkkk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptc21yb2p0bHN0cHBucHdta2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTg2NDAsImV4cCI6MjA4ODM5NDY0MH0.j7gxr5CvrfvbJJzK_pMwVHiCE2AqpXUTThpeLEBmsos',);

const AuthContext = createContext(null);

// 2. الاشعارات
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

export const useAuth = () => useContext(AuthContext);

function useProtectedRoute(session) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!session &&!inAuthGroup) router.replace('/welcome');
    else if (session && inAuthGroup) router.replace('/rooms');
  }, [session, segments]);
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    registerForPushNotificationsAsync();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    setLoading(false);
    // تحديث حالة نشط
    await supabase.from('profiles').update({ is_online: true, last_seen: new Date() }).eq('id', userId);
  };

  useProtectedRoute(session);

  return (
    <AuthContext.Provider value={{ session, profile, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status!== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  if (supabase.auth.getUser()) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({ expo_push_token: token }).eq('id', user.id);
  }
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="rooms" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="privacy" />
      </Stack>
    </AuthProvider>
  );
}
