import { useState } from 'react';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocalUser, saveTargetLanguages } from '@/db/onboarding';
import { ContinueButton, OptionCard } from '@/features/onboarding/controls';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';

export default function TargetLanguagesScreen() {
  const db = useSQLiteContext();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['en']));
  const [saving, setSaving] = useState(false);
  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  async function continueOnboarding() {
    if (!selected.size) return;
    setSaving(true);
    try {
      const user = await getLocalUser(db);
      if (!user) return router.replace('/(onboarding)/teacher-language');
      await saveTargetLanguages(db, user.id, [...selected]);
      router.replace('/(onboarding)/pronunciation');
    } finally { setSaving(false); }
  }
  return (
    <OnboardingScreen step={2} eyebrow="Choose your journey" title="What would you like to learn?" subtitle="Start with one today. Lipi is ready for more languages as you grow." footer={<ContinueButton disabled={!selected.size} loading={saving} onPress={continueOnboarding} />}>
      <OptionCard label="English" nativeLabel="English" detail="Letters, sounds, and everyday confidence" badge="En" selected={selected.has('en')} onPress={() => toggle('en')} />
    </OnboardingScreen>
  );
}
