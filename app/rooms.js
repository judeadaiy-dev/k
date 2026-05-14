import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { useEffect, useState } from 'react';

export default function RoomsScreen() {
  const { session, supabase } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
    fetchRooms();
  }, []);

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setProfile(data);
  }

  async function fetchRooms() {
    // حالياً وهمية. بعدين نربطها بجدول rooms
    setRooms([
      { id: '1', name: 'غرفة عامة', description: 'دردشة للجميع' },
      { id: '2', name: 'مبرمجين العراق', description: 'نقاشات تقنية' },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>اهلا {profile?.username || session.user.email}</Text>
          <Text style={styles.headerSub}>اختر غرفة للبدء</Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.logout}>خروج</Text>
        </TouchableOpacity>
      </View>

      {profile?.role === 'admin' && (
        <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/admin')}>
          <Text style={styles.adminText}>لوحة الادمن</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/chat/${item.id}`} asChild>
            <TouchableOpacity style={styles.room}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomDesc}>{item.description}</Text>
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  logout: { color: '#EF4444', fontSize: 16 },
  adminBtn: { backgroundColor: '#F59E0B', marginHorizontal: 15, padding: 12, borderRadius: 10, marginBottom: 15 },
  adminText: { color: '#000', fontWeight: 'bold', textAlign: 'center' },
  room: { backgroundColor: '#1E293B', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 12 },
  roomName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  roomDesc: { color: '#94a3b8', fontSize: 14 },
});
