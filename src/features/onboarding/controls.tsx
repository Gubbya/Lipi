import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface OptionProps {
  label: string;
  nativeLabel?: string;
  detail: string;
  badge: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ label, nativeLabel, detail, badge, selected, onPress }: OptionProps) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
      <View style={[styles.badge, selected && styles.badgeSelected]}><Text style={styles.badgeText}>{badge}</Text></View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{label}{nativeLabel ? <Text style={styles.native}>  {nativeLabel}</Text> : null}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}

export function ContinueButton({ label = 'Continue', disabled, loading, onPress }: { label?: string; disabled?: boolean; loading?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{loading ? 'Saving…' : label}</Text><Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: { minHeight: 88, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 22, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper },
  optionSelected: { borderColor: colors.mintDark, backgroundColor: '#F3FBF6' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  badge: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft },
  badgeSelected: { backgroundColor: colors.mint },
  badgeText: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  optionCopy: { flex: 1, marginLeft: 14 },
  optionTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  native: { color: colors.mintDark, fontWeight: '600' },
  detail: { marginTop: 4, color: colors.muted, fontSize: 13, lineHeight: 18 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C7CEC8', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.mintDark },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mintDark },
  button: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.ink, shadowColor: colors.ink, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  arrow: { marginLeft: 10, color: colors.gold, fontSize: 22, fontWeight: '700' },
});
