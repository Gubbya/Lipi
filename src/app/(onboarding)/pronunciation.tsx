import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getContentPackage } from '@/content';
import { getCourse } from '@/content/course-catalog';
import { finishOnboarding, getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { ContinueButton, OptionCard } from '@/features/onboarding/controls';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';
import { colors } from '@/features/onboarding/theme';

const englishContent = getContentPackage('en');

export default function PronunciationScreen() {
  const db = useSQLiteContext();
  const [selected, setSelected] = useState<string | null>(null);
  const [hasEnglish, setHasEnglish] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getLocalUser(db);
      if (!user) return router.replace('/(onboarding)/teacher-language');
      const languages = await getSelectedLanguages(db, user.id);
      setHasEnglish(languages.some((language) => language.language_id === 'en'));
    })();
  }, [db]);

  async function finish() {
    if (hasEnglish && !selected) return;
    setSaving(true);
    try {
      const user = await getLocalUser(db);
      if (!user) return router.replace('/(onboarding)/teacher-language');
      const languages = await getSelectedLanguages(db, user.id);
      await finishOnboarding(db, user.id, languages.map((language) => {
        const course = getCourse(language.language_id);
        return {
          languageId: language.language_id,
          pronunciationVariantId: language.language_id === 'en' ? selected : null,
          currentLevelId: language.language_id === 'en' ? englishContent.levels[0].id : (course?.lessons[0]?.id ?? null),
        };
      }));
      router.replace('/(tabs)/learn');
    } finally { setSaving(false); }
  }

  return (
    <OnboardingScreen
      step={3}
      eyebrow="One final detail"
      title={hasEnglish === false ? 'Your language shelf is ready.' : 'Choose your English sound.'}
      subtitle={hasEnglish === false ? 'Every selected course starts with its writing system and first sounds.' : 'Other courses use their native pronunciation. English lets you choose US or UK.'}
      footer={<ContinueButton label="Start learning" disabled={hasEnglish === null || (hasEnglish && !selected)} loading={saving} onPress={finish} />}
    >
      {hasEnglish ? englishContent.language.pronunciationVariants.map((variant) => (
        <OptionCard key={variant.id} label={variant.name} detail={variant.description} badge={variant.regionCode} selected={selected === variant.id} onPress={() => setSelected(variant.id)} />
      )) : <Text style={{ color: colors.mintDark, fontSize: 16, lineHeight: 24, fontWeight: '700' }}>✓ Scripts, starter lessons, vocabulary pictures, worksheets, and puzzles are ready.</Text>}
    </OnboardingScreen>
  );
}
