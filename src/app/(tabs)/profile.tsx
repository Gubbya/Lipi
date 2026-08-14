import { useCallback, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocalUser } from '@/db/onboarding';
import { createProfile, getProfiles, setActiveProfile, updateProfile, type LearnerProfileRow } from '@/db/profiles';
import { getPronunciationStats } from '@/db/pronunciation';
import { getReviewSummary } from '@/db/review';
import { downloadProgress, getLastSync, uploadProgress } from '@/services/cloud-sync';
import { getServerConfig, saveServerConfig } from '@/services/app-config';
import { colors } from '@/features/onboarding/theme';

const avatars = ['🌱', '🦊', '🐼', '🦉', '🐯', '🌻'];

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const [profiles, setProfiles] = useState<LearnerProfileRow[]>([]);
  const [activeId, setActiveId] = useState('');
  const [displayName, setDisplayName] = useState('Learner');
  const [avatar, setAvatar] = useState('🌱');
  const [newName, setNewName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [reviewStats, setReviewStats] = useState({ due: 0, total: 0 });
  const [pronunciationStats, setPronunciationStats] = useState({ attempts: 0, averageScore: null as number | null });
  const [lessonCount, setLessonCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const user = await getLocalUser(db);
    if (!user) return;
    setActiveId(user.id);
    setDisplayName(user.display_name);
    setAvatar(user.avatar_emoji);
    setProfiles(await getProfiles(db));
    setReviewStats(await getReviewSummary(db, user.id));
    setPronunciationStats(await getPronunciationStats(db, user.id));
    const lessons = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM lesson_completions WHERE user_id = ?', user.id);
    setLessonCount(lessons?.count ?? 0);
    const sync = await getLastSync(db, user.id);
    setLastSync(sync ? `${sync.status} · ${new Date(sync.created_at).toLocaleString()}` : null);
    const config = await getServerConfig();
    setServerUrl(config.serverUrl);
    setApiToken(config.apiToken);
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function saveProfile() {
    await updateProfile(db, activeId, displayName, avatar);
    await load();
    Alert.alert('Profile saved', 'Your learner name and avatar were updated.');
  }

  async function switchProfile(id: string) {
    if (id === activeId) return;
    await setActiveProfile(db, id);
    router.replace('/');
  }

  async function addProfile() {
    if (!newName.trim()) return Alert.alert('Add a name', 'Enter the learner’s name first.');
    await createProfile(db, newName, 'en');
    setNewName('');
    router.replace('/');
  }

  async function saveCloud() {
    setWorking('save');
    try {
      await saveServerConfig(serverUrl, apiToken);
      Alert.alert('Cloud settings saved', 'The server address and private token are stored only on this device.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Check the settings.');
    } finally { setWorking(null); }
  }

  async function sync(direction: 'upload' | 'download') {
    setWorking(direction);
    try {
      await saveServerConfig(serverUrl, apiToken);
      if (direction === 'upload') await uploadProgress(db, activeId); else await downloadProgress(db, activeId);
      await load();
      Alert.alert('Sync complete', direction === 'upload' ? 'This learner’s progress was backed up.' : 'Cloud progress was merged into this device.');
    } catch (error) {
      Alert.alert('Sync unavailable', error instanceof Error ? error.message : 'Check the server and try again.');
      await load();
    } finally { setWorking(null); }
  }

  return (
    <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>LEARNER SPACE</Text><Text style={styles.title}>Profile & progress</Text>
      <View style={styles.profileCard}><View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{avatar}</Text></View><View style={styles.profileCopy}><TextInput value={displayName} onChangeText={setDisplayName} style={styles.nameInput} /><Text style={styles.profileHint}>Active learner · {activeId.slice(0, 13)}</Text></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>{avatars.map((item) => <Pressable key={item} onPress={() => setAvatar(item)} style={[styles.avatarChoice, avatar === item && styles.avatarSelected]}><Text style={styles.avatarText}>{item}</Text></Pressable>)}</ScrollView>
      <Pressable onPress={saveProfile} style={styles.primaryButton}><Text style={styles.primaryText}>Save learner profile</Text></Pressable>

      <View style={styles.stats}><View style={styles.stat}><Text style={styles.statNumber}>{lessonCount}</Text><Text style={styles.statLabel}>lessons</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{reviewStats.total}</Text><Text style={styles.statLabel}>review cards</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{pronunciationStats.attempts}</Text><Text style={styles.statLabel}>recordings</Text></View></View>

      <Text style={styles.sectionTitle}>Learners on this device</Text>
      <View style={styles.list}>{profiles.map((profile) => <Pressable key={profile.id} onPress={() => switchProfile(profile.id)} style={[styles.profileRow, profile.id === activeId && styles.activeRow]}><Text style={styles.rowAvatar}>{profile.avatar_emoji}</Text><View style={styles.rowCopy}><Text style={styles.rowName}>{profile.display_name}</Text><Text style={styles.rowMeta}>{profile.onboarding_completed_at ? 'Ready to learn' : 'Onboarding not finished'}</Text></View><Text style={styles.rowAction}>{profile.id === activeId ? 'ACTIVE' : 'Switch →'}</Text></Pressable>)}</View>
      <View style={styles.addRow}><TextInput value={newName} onChangeText={setNewName} placeholder="New learner name" placeholderTextColor={colors.muted} style={styles.addInput} /><Pressable onPress={addProfile} style={styles.addButton}><Text style={styles.addButtonText}>＋ Add</Text></Pressable></View>

      <Text style={styles.sectionTitle}>Cloud & AI</Text>
      <View style={styles.cloudCard}><Text style={styles.label}>Lipi server URL</Text><TextInput value={serverUrl} onChangeText={setServerUrl} autoCapitalize="none" autoCorrect={false} placeholder="http://192.168.1.10:4100" placeholderTextColor={colors.muted} style={styles.field} /><Text style={styles.label}>Private API token</Text><TextInput value={apiToken} onChangeText={setApiToken} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Stored privately on this device" placeholderTextColor={colors.muted} style={styles.field} /><Text style={styles.help}>The MongoDB and Gemini keys remain on your server. They are never placed in the mobile app.</Text><Pressable disabled={Boolean(working)} onPress={saveCloud} style={styles.secondaryButton}><Text style={styles.secondaryText}>{working === 'save' ? 'Saving…' : 'Save cloud settings'}</Text></Pressable><View style={styles.syncRow}><Pressable disabled={Boolean(working)} onPress={() => sync('upload')} style={styles.syncButton}><Text style={styles.syncText}>{working === 'upload' ? 'Uploading…' : '↑ Back up'}</Text></Pressable><Pressable disabled={Boolean(working)} onPress={() => sync('download')} style={styles.syncButton}><Text style={styles.syncText}>{working === 'download' ? 'Downloading…' : '↓ Restore'}</Text></Pressable></View>{lastSync ? <Text style={styles.lastSync}>Last sync: {lastSync}</Text> : null}</View>

      <View style={styles.privacy}><Text style={styles.privacyTitle}>Offline-first privacy</Text><Text style={styles.help}>Lessons, recordings, and progress stay on this device unless you choose Back up. Raw voice recordings are not included in cloud snapshots.</Text></View>
      <Pressable onPress={() => router.push('/(tabs)/admin' as Href)} style={styles.studioButton}><View><Text style={styles.studioTitle}>Content review studio</Text><Text style={styles.studioSubtitle}>Track native-speaker approval and curriculum notes</Text></View><Text style={styles.studioArrow}>→</Text></Pressable>
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, page: { padding: 24, paddingBottom: 50 }, eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { marginTop: 5, color: colors.ink, fontSize: 29, fontWeight: '900' }, profileCard: { marginTop: 22, padding: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink }, avatarLarge: { width: 64, height: 64, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold }, avatarLargeText: { fontSize: 32 }, profileCopy: { flex: 1, marginLeft: 15 }, nameInput: { padding: 0, color: '#fff', fontSize: 22, fontWeight: '900' }, profileHint: { marginTop: 5, color: '#BFD1CB', fontSize: 9 }, avatarRow: { paddingVertical: 14, gap: 8 }, avatarChoice: { width: 45, height: 45, borderRadius: 15, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, avatarSelected: { borderWidth: 2, borderColor: colors.coral, backgroundColor: colors.coralSoft }, avatarText: { fontSize: 22 }, primaryButton: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coral }, primaryText: { color: '#fff', fontSize: 13, fontWeight: '900' }, stats: { marginTop: 20, flexDirection: 'row', gap: 8 }, stat: { flex: 1, padding: 14, borderRadius: 17, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line }, statNumber: { color: colors.ink, fontSize: 22, fontWeight: '900' }, statLabel: { marginTop: 3, color: colors.muted, fontSize: 9, fontWeight: '700' }, sectionTitle: { marginTop: 30, marginBottom: 12, color: colors.ink, fontSize: 20, fontWeight: '900' }, list: { gap: 8 }, profileRow: { minHeight: 67, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' }, activeRow: { borderColor: colors.mintDark, backgroundColor: '#ECF7F1' }, rowAvatar: { fontSize: 25 }, rowCopy: { flex: 1, marginLeft: 12 }, rowName: { color: colors.ink, fontSize: 14, fontWeight: '800' }, rowMeta: { marginTop: 3, color: colors.muted, fontSize: 9 }, rowAction: { color: colors.coral, fontSize: 9, fontWeight: '900' }, addRow: { marginTop: 10, flexDirection: 'row', gap: 8 }, addInput: { flex: 1, minHeight: 48, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: colors.line, color: colors.ink, backgroundColor: '#fff' }, addButton: { minWidth: 88, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, addButtonText: { color: colors.gold, fontSize: 12, fontWeight: '900' }, cloudCard: { padding: 18, borderRadius: 23, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line }, label: { marginTop: 8, marginBottom: 6, color: colors.ink, fontSize: 11, fontWeight: '800' }, field: { minHeight: 49, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, borderColor: colors.line, color: colors.ink, backgroundColor: colors.cream, fontSize: 12 }, help: { marginTop: 11, color: colors.muted, fontSize: 10, lineHeight: 16 }, secondaryButton: { minHeight: 46, marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.ink, fontSize: 12, fontWeight: '800' }, syncRow: { marginTop: 9, flexDirection: 'row', gap: 8 }, syncButton: { flex: 1, minHeight: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, syncText: { color: colors.gold, fontSize: 11, fontWeight: '900' }, lastSync: { marginTop: 10, color: colors.muted, fontSize: 9, textAlign: 'center' }, privacy: { marginTop: 21, padding: 16, borderRadius: 18, backgroundColor: colors.mint }, privacyTitle: { color: colors.mintDark, fontSize: 13, fontWeight: '900' },
  studioButton: { minHeight: 72, marginTop: 12, padding: 16, borderRadius: 19, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }, studioTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' }, studioSubtitle: { marginTop: 4, color: colors.muted, fontSize: 9 }, studioArrow: { color: colors.coral, fontSize: 20, fontWeight: '900' },
});
