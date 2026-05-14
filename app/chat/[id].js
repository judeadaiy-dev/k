import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: `غرفة ${id}`, headerStyle: { backgroundColor: '#1E293B' }, headerTintColor: '#fff' }} />
      <Text style={styles.text}>واجهة الدردشة {id} تشتغل</Text>
      <Text style={styles.subtext}>بعدين نربطها بـ Supabase</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 20, marginBottom: 10 },
  subtext: { color: '#94a3b8', fontSize: 14 },
});
