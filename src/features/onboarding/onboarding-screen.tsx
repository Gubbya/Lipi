import type { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface Props extends PropsWithChildren {
  step: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export function OnboardingScreen({ step, eyebrow, title, subtitle, footer, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${step * 33.333}%` }]} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>Lipi <Text style={styles.dot}>•</Text></Text>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.options}>{children}</View>
      </ScrollView>
      <View style={styles.footer}>{footer}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  progressTrack: { height: 5, backgroundColor: '#EEE9DC' },
  progressFill: { height: 5, backgroundColor: colors.coral, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  dot: { color: colors.coral },
  eyebrow: { marginTop: 44, color: colors.mintDark, fontSize: 12, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' },
  title: { marginTop: 12, maxWidth: 330, color: colors.ink, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { marginTop: 13, maxWidth: 340, color: colors.muted, fontSize: 16, lineHeight: 24 },
  options: { marginTop: 34, gap: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 22, backgroundColor: colors.cream },
});
