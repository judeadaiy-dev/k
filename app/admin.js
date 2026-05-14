import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { useEffect, useState } from 'react';

export default function AdminScreen() {
  const { session, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (data?.role !== 'admin') {
      router.replace('/rooms'); // اذا مو ادمن طرده
    }
    setLoading(false);
  }

  if (loading) return <View style={styles.container}><Text style={styles.text}>جاري التحقق...</Text></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'لوحة الادمن', headerStyle: { backgroundColor: '#1E293B' }, headerTintColor: '#fff' }} />
      <Text style={styles.title}>لوحة تحكم الادمن</Text>
      <Text style={styles.text}>هنا تكدر تحظر مستخدمين وتشوف التقارير</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#F59E0B', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  text: { color: '#fff', fontSize: 16 },
});
