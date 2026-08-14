import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/features/onboarding/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.coral, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 74, paddingTop: 8, paddingBottom: 12, borderTopColor: '#ECE9DF', backgroundColor: '#FFFEFA' } }}>
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>◉</Text> }} />
      <Tabs.Screen name="puzzles" options={{ title: 'Puzzles', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◇</Text> }} />
      <Tabs.Screen name="lesson/[levelId]" options={{ href: null }} />
      <Tabs.Screen name="multilingual/[languageId]" options={{ href: null }} />
      <Tabs.Screen name="manage-languages" options={{ href: null }} />
    </Tabs>
  );
}
