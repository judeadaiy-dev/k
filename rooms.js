import { View, Text, TextInput, Pressable, FlatList, Image, Alert, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './_layout';
import { useState, useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { styled } from 'nativewind';

const { width } = Dimensions.get('window');
const SView = styled(View);
const SText = styled(Text);
const SPress = styled(Pressable);
const SInput = styled(TextInput);
const SBlur = styled(BlurView);
const SSafe = styled(SafeAreaView);
const SAnimated = styled(Animated.View);

export default function Rooms() {
  const { session, profile, supabase } = useAuth();
  const [tab, setTab] = useState('chats'); // chats, profile, admin, privacy
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [editingMsg, setEditingMsg] = useState(null);
  const [isTyping, setIsTyping] = useState({});
  const [reports, setReports] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // انيميشن المنيو الازلاقي
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!session) return;
    fetchUsers();
    fetchBlocked();
    if (profile?.is_admin) fetchReports();
    
    const msgChannel = supabase.channel('messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handleMessageChange)
    .subscribe();
    
    const typingChannel = supabase.channel('typing')
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setIsTyping(prev => ({...prev, [payload.user_id]: payload.is_typing }));
        setTimeout(() => setIsTyping(prev => ({...prev, [payload.user_id]: false })), 3000);
      }).subscribe();

    return () => { supabase.removeChannel(msgChannel); supabase.removeChannel(typingChannel); };
  }, [session]);

  // انيميشن فتح/قفل المنيو
  const toggleMenu = (open) => {
    setMenuOpen(open);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: open? 0 : -width, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: open? 1 : 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const handleMessageChange = (payload) => {
    if (payload.eventType === 'INSERT') setMessages(prev => [...prev, payload.new]);
    if (payload.eventType === 'UPDATE') setMessages(prev => prev.map(m => m.id === payload.new.id? payload.new : m));
    if (payload.eventType === 'DELETE') setMessages(prev => prev.filter(m => m.id!== payload.old.id));
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('id', session.user.id);
    setUsers(data || []);
  };

  const fetchBlocked = async () => {
    const { data } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', session.user.id);
    setBlocked(data?.map(b => b.blocked_id) || []);
  };

  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('*,reporter:profiles!reporter_id(username),reported:profiles!reported_id(username)').order('created_at', { ascending: false });
    setReports(data || []);
  };

  const openChat = async (userId) => {
    setSelectedChat(userId);
    const { data } = await supabase.from('messages')
    .select('*')
    .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${session.user.id})`)
    .order('created_at');
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() &&!editingMsg) return;
    if (editingMsg) {
      await supabase.from('messages').update({ content: newMessage, edited: true }).eq('id', editingMsg);
      setEditingMsg(null);
    } else {
      await supabase.from('messages').insert({ sender_id: session.user.id, receiver_id: selectedChat, content: newMessage, type: 'text' });
    }
    setNewMessage('');
  };

  // 1. شريط سفلي حديث + شاشات
  return (
    <SView className="flex-1 bg-sea-900">
      <SSafe className="flex-1">
        {/* الهيدر */}
        <SBlur intensity={80} tint="dark" className="p-4 border-b border-white/10 flex-row justify-between items-center">
          <SText className="text-2xl font-bold text-sea-500">Sea Chat</SText>
          <SPress onPress={() => toggleMenu(true)}>
            <Ionicons name="menu" size={28} color="#38BDF8" />
          </SPress>
        </SBlur>

        {/* المحتوى حسب التاب */}
        {tab === 'chats' &&!selectedChat && <ChatsList users={users} blocked={blocked} isTyping={isTyping} openChat={openChat} />}
        {tab === 'chats' && selectedChat && <ChatScreen messages={messages} selectedChat={selectedChat} setSelectedChat={setSelectedChat} newMessage={newMessage} setNewMessage={setNewMessage} sendMessage={sendMessage} editingMsg={editingMsg} setEditingMsg={setEditingMsg} supabase={supabase} session={session} users={users} />}
        {tab === 'profile' && <ProfileScreen profile={profile} supabase={supabase} />}
        {tab === 'admin' && <AdminScreen reports={reports} />}
        {tab === 'privacy' && <PrivacyScreen />}

        {/* الشريط السفلي الحديث - Glassmorphism */}
        {!selectedChat && (
          <SBlur intensity={90} tint="dark" className="absolute bottom-0 left-0 right-0 border-t border-white/10">
            <SView className="flex-row justify-around items-center py-3 px-6">
              <TabButton icon="chatbubbles" label="المحادثات" active={tab==='chats'} onPress={() => setTab('chats')} />
              <TabButton icon="person" label="بروفايلي" active={tab==='profile'} onPress={() => setTab('profile')} />
              {profile?.is_admin && <TabButton icon="shield-checkmark" label="الادمن" active={tab==='admin'} onPress={() => setTab('admin')} />}
              <TabButton icon="document-text" label="الخصوصية" active={tab==='privacy'} onPress={() => setTab('privacy')} />
            </SView>
          </SBlur>
        )}
      </SSafe>

      {/* المنيو الازلاقي مع انيميشن */}
      {menuOpen && (
        <SAnimated style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: fadeAnim }}>
          <SPress className="flex-1 bg-black/50" onPress={() => toggleMenu(false)} />
          <SAnimated style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.75, transform: [{ translateX: slideAnim }] }}>
            <SBlur intensity={100} tint="dark" className="flex-1 border-r border-white/20 pt-14">
              <SView className="p-6">
                <SText className="text-white text-2xl font-bold mb-8">القائمة</SText>
                <MenuItem icon="chatbubbles" text="المحادثات" onPress={() => { setTab('chats'); toggleMenu(false); }} />
                <MenuItem icon="person" text="بروفايلي" onPress={() => { setTab('profile'); toggleMenu(false); }} />
                {profile?.is_admin && <MenuItem icon="shield-checkmark" text="لوحة الادمن" onPress={() => { setTab('admin'); toggleMenu(false); }} />}
                <MenuItem icon="document-text" text="سياسة الخصوصية" onPress={() => { setTab('privacy'); toggleMenu(false); }} />
                <MenuItem icon="log-out" text="تسجيل خروج" danger onPress={() => supabase.auth.signOut()} />
              </SView>
            </SBlur>
          </SAnimated>
        </SAnimated>
      )}
    </SView>
  );
}

// كومبوننت التاب
const TabButton = ({ icon, label, active, onPress }) => (
  <SPress onPress={onPress} className="items-center">
    <SAnimated.View style={{ transform: [{ scale: active? 1.1 : 1 }] }}>
      <Ionicons name={icon} size={26} color={active? '#38BDF8' : '#64748B'} />
    </SAnimated.View>
    <SText className={`text-xs mt-1 ${active? 'text-sea-500 font-bold' : 'text-sea-400'}`}>{label}</SText>
  </SPress>
);

// كومبوننت عنصر المنيو
const MenuItem = ({ icon, text, onPress, danger }) => (
  <SPress onPress={onPress} className="flex-row items-center p-4 mb-2 rounded-2xl active:bg-white/10">
    <Ionicons name={icon} size={24} color={danger? '#EF4444' : '#38BDF8'} />
    <SText className={`text-lg ml-4 ${danger? 'text-danger' : 'text-white'}`}>{text}</SText>
  </SPress>
);

// شاشة المحادثات
const ChatsList = ({ users, blocked, isTyping, openChat }) => (
  <FlatList data={users.filter(u =>!blocked.includes(u.id))} keyExtractor={i => i.id} contentContainerStyle={{ paddingBottom: 100 }}
    renderItem={({ item }) => (
      <SPress className="flex-row items-center p-4 border-b border-white/5 active:bg-white/5" onPress={() => openChat(item.id)}>
        <SView className="w-14 h-14 bg-sea-500/20 rounded-full items-center justify-center mr-3 border border-sea-500/30">
          <SText className="text-sea-500 font-bold text-xl">{item.username?.[0]?.toUpperCase()}</SText>
          {item.is_online && <SView className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-sea-900" />}
        </SView>
        <SView className="flex-1">
          <SText className="text-white text-lg font-semibold">{item.username}</SText>
          <SText className="text-sea-400 text-xs">{isTyping[item.id]? 'يكتب الآن...' : item.is_online? 'متصل' : 'غير متصل'}</SText>
        </SView>
      </SPress>
    )} />
);

// شاشة الشات مع انيميشن
const ChatScreen = ({ messages, selectedChat, setSelectedChat, newMessage, setNewMessage, sendMessage, editingMsg, setEditingMsg, supabase, session, users }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const animateSend = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    sendMessage();
  };

  return (
    <SView className="flex-1">
      <SBlur intensity={80} className="p-4 border-b border-white/10 flex-row items-center">
        <SPress onPress={() => setSelectedChat(null)}><Ionicons name="arrow-back" size={28} color="#38BDF8" /></SPress>
        <SText className="text-white text-xl font-bold ml-4 flex-1">{users.find(u => u.id === selectedChat)?.username}</SText>
      </SBlur>
      <FlatList data={messages} keyExtractor={i => i.id.toString()} className="flex-1 px-4"
        renderItem={({ item, index }) => {
          const isMe = item.sender_id === session.user.id;
          const opacity = useRef(new Animated.Value(0)).current;
          useEffect(() => { Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }).start(); }, []);
          return (
            <SAnimated style={{ opacity, transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}
              className={`my-1 max-w-[75%] ${isMe? 'self-end' : 'self-start'}`}>
              <SBlur intensity={60} className={`p-3 rounded-3xl border ${isMe? 'bg-sea-500/20 border-sea-500/30 rounded-br-md' : 'bg-white/10 border-white/20 rounded-bl-md'}`}>
                <SText className="text-white">{item.content}{item.edited && <SText className="text-xs text-sea-400"> (معدل)</SText>}</SText>
              </SBlur>
            </SAnimated>
          );
        }} />
      <SBlur intensity={80} className="p-3 border-t border-white/10 flex-row items-center">
        <SInput className="flex-1 bg-white/10 text-white mx-2 p-4 rounded-2xl border border-white/20" placeholder="رسالة..." placeholderTextColor="#94A3B8" value={newMessage} onChangeText={setNewMessage} />
        <SAnimated style={{ transform: [{ scale: scaleAnim }] }}>
          <SPress onPress={animateSend} className="bg-sea-500 p-4 rounded-2xl"><Ionicons name="send" size={22} color="white" /></SPress>
        </SAnimated>
      </SBlur>
    </SView>
  );
};

// باقي الشاشات
const ProfileScreen = ({ profile, supabase }) => {
  const [username, setUsername] = useState(profile?.username || '');
  return (
    <SView className="flex-1 p-6">
      <SText className="text-3xl font-bold text-white mb-8">بروفايلي</SText>
      <SText className="text-sea-400 mb-2">اسم المستخدم</SText>
      <SInput className="bg-white/10 text-white p-4 rounded-2xl mb-6 border border-white/20" value={username} onChangeText={setUsername} />
      <SPress className="bg-sea-500 p-4 rounded-2xl" onPress={async () => { await supabase.from('profiles').update({ username }).eq('id', profile.id); Alert.alert('تم', 'تم التحديث'); }}>
        <SText className="text-white text-center font-bold">حفظ</SText>
      </SPress>
    </SView>
  );
};

const AdminScreen = ({ reports }) => (
  <FlatList data={reports} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16 }}
    renderItem={({ item }) => (
      <SBlur intensity={60} className="p-4 mb-3 rounded-2xl border border-white/10">
        <SText className="text-white">المبلغ: {item.reporter.username}</SText>
        <SText className="text-danger">المبلغ عنه: {item.reported.username}</SText>
        <SText className="text-sea-400 text-xs mt-2">{item.reason}</SText>
      </SBlur>
    )} />
);

const PrivacyScreen = () => (
  <ScrollView className="flex-1 p-6">
    <SText className="text-3xl font-bold text-white mb-6">سياسة الخصوصية</SText>
    <SText className="text-white text-base leading-7">
      1. نجمع رسائلك لتقديم الخدمة فقط.{'\n\n'}
      2. لا نشارك بياناتك مع طرف ثالث.{'\n\n'}
      3. يمكنك حذف حسابك باي وقت.{'\n\n'}
      4. الرسائل مشفرة في قاعدة البيانات.
    </SText>
  </ScrollView>
);
