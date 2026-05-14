import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from './_layout';

const FAKE_ROOMS = [
  { id: '1', name: 'غرفة عامة', last_msg: 'اهلا بالكل' },
  { id: '2', name: 'مبرمجين', last_msg: 'شنو اخر تحديث؟' },
];

export default function RoomsScreen() {
  const { supabase } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الغرف</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.logout}>خروج</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={FAKE_ROOMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/chat/${item.id}`} asChild>
            <TouchableOpacity style={styles.room}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.lastMsg}>{item.last_msg}</Text>
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  logout: { color: '#EF4444', fontSize: 16 },
  room: { backgroundColor: '#1E293B', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 12 },
  roomName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  lastMsg: { color: '#94a3b8', fontSize: 14 },
});
