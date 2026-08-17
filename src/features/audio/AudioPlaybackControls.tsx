import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/features/onboarding/theme';
import type { LearningAudioKind, LearningAudioSpeed } from './use-learning-audio';

interface AudioPlaybackControlsProps {
  activeKind?: LearningAudioKind;
  activeSpeed?: LearningAudioSpeed;
  compact?: boolean;
  hasRecording: boolean;
  isActive?: boolean;
  onNormal: () => void;
  onSlow: () => void;
  tint?: string;
}

export function AudioPlaybackControls({
  activeKind,
  activeSpeed,
  compact = false,
  hasRecording,
  isActive = false,
  onNormal,
  onSlow,
  tint = colors.coral,
}: AudioPlaybackControlsProps) {
  const sourceLabel = hasRecording ? 'CLEAR RECORDING · STREAMS ONLINE' : 'DEVICE VOICE FALLBACK';
  return (
    <View style={[styles.wrap, compact && styles.compactWrap]}>
      {!compact ? <Text style={styles.source}>{isActive && activeKind === 'recording' ? 'PLAYING OFFLINE RECORDING' : isActive && activeKind === 'streaming' ? 'STREAMING CLEAR RECORDING' : isActive && activeKind === 'device' ? 'PLAYING DEVICE VOICE' : sourceLabel}</Text> : null}
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Play at normal speed" onPress={onNormal} style={({ pressed }) => [styles.button, compact && styles.compactButton, isActive && activeSpeed === 'normal' && { borderColor: tint, backgroundColor: `${tint}18` }, pressed && styles.pressed]}>
          <Text style={[styles.icon, { color: tint }]}>▶</Text><Text style={styles.label}>Normal</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Play slowly" onPress={onSlow} style={({ pressed }) => [styles.button, compact && styles.compactButton, isActive && activeSpeed === 'slow' && { borderColor: tint, backgroundColor: `${tint}18` }, pressed && styles.pressed]}>
          <Text style={[styles.icon, { color: tint }]}>◖</Text><Text style={styles.label}>Slow</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18, alignItems: 'center' },
  compactWrap: { marginTop: 0, alignItems: 'flex-start' },
  source: { marginBottom: 7, color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 8 },
  button: { minHeight: 44, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  compactButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 10 },
  icon: { marginRight: 6, fontSize: 12, fontWeight: '900' },
  label: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
