import { useState } from 'react';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getContentPackage } from '@/content';
import { finishOnboarding, getLocalUser } from '@/db/onboarding';
import { ContinueButton, OptionCard } from '@/features/onboarding/controls';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';

const content = getContentPackage('en');

export default function PronunciationScreen() {
  const db = useSQLiteContext();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function finish() {
    if (!selected) return;
    setSaving(true);
    try {
      const user = await getLocalUser(db);
      if (!user) return router.replace('/(onboarding)/teacher-language');
      await finishOnboarding(db, user.id, 'en', selected, content.levels[0].id);
      router.replace('/(tabs)/learn');
    } finally { setSaving(false); }
  }
  return (
    <OnboardingScreen step={3} eyebrow="Make it sound like you" title="Choose your English sound." subtitle="You can change this later. Both choices teach the same strong foundations." footer={<ContinueButton label="Start learning" disabled={!selected} loading={saving} onPress={finish} />}>
      {content.language.pronunciationVariants.map((variant) => <OptionCard key={variant.id} label={variant.name} detail={variant.description} badge={variant.regionCode === 'US' ? 'US' : 'UK'} selected={selected === variant.id} onPress={() => setSelected(variant.id)} />)}
    </OnboardingScreen>
  );
}
