import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/features/onboarding/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.coral, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 74, paddingTop: 8, paddingBottom: 12, borderTopColor: '#ECE9DF', backgroundColor: '#FFFEFA' } }}>
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>◉</Text> }} />
      <Tabs.Screen name="practice" options={{ title: 'Practice', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>↻</Text> }} />
      <Tabs.Screen name="puzzles" options={{ title: 'Puzzles', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◇</Text> }} />
      <Tabs.Screen name="tutor" options={{ title: 'Tutor', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>✦</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>●</Text> }} />
      <Tabs.Screen name="lesson/[levelId]" options={{ href: null }} />
      <Tabs.Screen name="multilingual/[languageId]" options={{ href: null }} />
      <Tabs.Screen name="manage-languages" options={{ href: null }} />
      <Tabs.Screen name="worksheets" options={{ href: null }} />
      <Tabs.Screen name="admin" options={{ href: null }} />
    </Tabs>
  );
}
