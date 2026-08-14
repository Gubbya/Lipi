import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/features/onboarding/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.coral, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 74, paddingTop: 8, paddingBottom: 12, borderTopColor: '#ECE9DF', backgroundColor: '#FFFEFA' } }}>
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>◉</Text> }} />
    </Tabs>
  );
}
