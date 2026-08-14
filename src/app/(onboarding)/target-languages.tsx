import { useState } from 'react';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { targetLanguageOptions } from '@/content/course-catalog';
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
    <OnboardingScreen
      step={2}
      eyebrow={`${selected.size} selected · choose one or many`}
      title="Which languages call to you?"
      subtitle="Learn each course separately, then combine selected languages in puzzles. You can change this list later."
      footer={<ContinueButton disabled={!selected.size} loading={saving} onPress={continueOnboarding} />}
    >
      {targetLanguageOptions.map((course) => (
        <OptionCard
          key={course.id}
          label={course.name}
          nativeLabel={course.nativeName === course.name ? undefined : course.nativeName}
          detail={`${course.scriptName} · ${course.description}`}
          badge={course.preview.split(' ')[0]}
          selected={selected.has(course.id)}
          onPress={() => toggle(course.id)}
        />
      ))}
    </OnboardingScreen>
  );
}
