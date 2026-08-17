import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  downloadLessonAudio,
  getLessonDownloadState,
  lessonDownloadsSupported,
  removeLessonAudio,
  type LessonDownloadState,
} from '@/services/lesson-downloads';
import { colors } from '@/features/onboarding/theme';

interface LessonAudioDownloadProps {
  accentColor?: string;
  paths: string[];
}

type WorkingState = 'checking' | 'downloading' | 'removing' | null;

export function LessonAudioDownload({ accentColor = colors.coral, paths }: LessonAudioDownloadProps) {
  const pathKey = [...new Set(paths)].sort().join('|');
  const stablePaths = useMemo(() => pathKey ? pathKey.split('|') : [], [pathKey]);
  const [state, setState] = useState<LessonDownloadState>({ complete: false, downloaded: 0, total: stablePaths.length });
  const [working, setWorking] = useState<WorkingState>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getLessonDownloadState(stablePaths)
      .then((next) => { if (active) setState(next); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not check this download.'); })
      .finally(() => { if (active) setWorking(null); });
    return () => { active = false; };
  }, [stablePaths]);

  if (!stablePaths.length || !lessonDownloadsSupported()) return null;

  async function download() {
    setError('');
    setWorking('downloading');
    setProgress(state.downloaded);
    try {
      const next = await downloadLessonAudio(stablePaths, (completed) => setProgress(completed));
      setState(next);
    } catch (reason) {
      setState(await getLessonDownloadState(stablePaths));
      setError(reason instanceof Error ? reason.message : 'Lesson download failed.');
    } finally {
      setWorking(null);
    }
  }

  async function remove() {
    setError('');
    setWorking('removing');
    try {
      setState(await removeLessonAudio(stablePaths));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not remove this lesson audio.');
    } finally {
      setWorking(null);
    }
  }

  const disabled = Boolean(working);
  const downloaded = working === 'downloading' ? progress : state.downloaded;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: `${accentColor}1A` }]}><Text style={[styles.iconText, { color: accentColor }]}>{state.complete ? '✓' : '↓'}</Text></View>
        <View style={styles.copy}>
          <Text style={styles.title}>{state.complete ? 'Offline audio ready' : working === 'downloading' ? `Saving ${downloaded}/${state.total}` : state.downloaded ? `Resume offline pack · ${state.downloaded}/${state.total}` : `Go offline · ${state.total} clear clips`}</Text>
          <Text style={styles.subtitle}>{state.complete ? 'Kept until you delete it. Learning progress is separate.' : 'Clear audio streams online; save this lesson only when needed.'}</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={disabled} onPress={state.complete ? remove : download} style={({ pressed }) => [styles.button, { borderColor: accentColor }, disabled && styles.disabled, pressed && styles.pressed]}>
          <Text style={[styles.buttonText, { color: accentColor }]}>{working === 'checking' ? '…' : working === 'removing' ? 'Removing' : state.complete ? 'Delete' : working === 'downloading' ? `${Math.round((downloaded / Math.max(1, state.total)) * 100)}%` : state.downloaded ? 'Resume' : 'Go offline'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, padding: 11, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFDF8' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 16, fontWeight: '900' },
  copy: { flex: 1, marginHorizontal: 10 },
  title: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  subtitle: { marginTop: 2, color: colors.muted, fontSize: 8, lineHeight: 11 },
  button: { minWidth: 70, minHeight: 34, paddingHorizontal: 9, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  buttonText: { fontSize: 9, fontWeight: '900' },
  error: { marginTop: 7, color: '#A64A3A', fontSize: 9, lineHeight: 13 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
});
