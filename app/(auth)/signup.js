import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../_layout';
import { Link } from 'expo-router';

export default function SignUpScreen() {
  const { supabase } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { emailRedirectTo: undefined } // بدون تأكيد ايميل
    });
    if (error) Alert.alert('خطأ', error.message);
    else Alert.alert('تم', 'تم انشاء الحساب. سجل دخولك الآن');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>حساب جديد</Text>
      <TextInput style={styles.input} placeholder="الايميل" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={signUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading? 'جاري...' : 'انشاء حساب'}</Text>
      </TouchableOpacity>
      <Link href="/(auth)/login" style={styles.link}>عندك حساب؟ سجل دخول</Link>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#1E293B', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  link: { color: '#3B82F6', textAlign: 'center', marginTop: 20 },
});
