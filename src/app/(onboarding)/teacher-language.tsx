import { useState } from 'react';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { saveTeacherLanguage } from '@/db/onboarding';
import { ContinueButton, OptionCard } from '@/features/onboarding/controls';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';

const options = [
  { id: 'mr', label: 'Marathi', nativeLabel: 'मराठी', detail: 'Learn with guidance in Marathi', badge: 'म' },
  { id: 'en', label: 'English', nativeLabel: 'English', detail: 'Learn with guidance in English', badge: 'A' },
] as const;

export default function TeacherLanguageScreen() {
  const db = useSQLiteContext();
  const [selected, setSelected] = useState<'mr' | 'en' | null>(null);
  const [saving, setSaving] = useState(false);
  async function continueOnboarding() {
    if (!selected) return;
    setSaving(true);
    try { await saveTeacherLanguage(db, selected); router.replace('/(onboarding)/target-languages'); } finally { setSaving(false); }
  }
  return (
    <OnboardingScreen step={1} eyebrow="First, your guide" title="Which language feels like home?" subtitle="We’ll use it for explanations and helpful hints." footer={<ContinueButton disabled={!selected} loading={saving} onPress={continueOnboarding} />}>
      {options.map((option) => <OptionCard key={option.id} {...option} selected={selected === option.id} onPress={() => setSelected(option.id)} />)}
    </OnboardingScreen>
  );
}
