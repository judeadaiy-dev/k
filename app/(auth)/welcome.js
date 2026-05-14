import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🌊 SeaChat</Text>
      <Text style={styles.subtitle}>دردشة آمنة وسريعة</Text>
      <Link href="/(auth)/login" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
  button: { backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, width: '100%' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});
