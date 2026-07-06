import { Tabs, useRouter } from 'expo-router';
import { Activity, House, Settings2, Sparkles, Target } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@shared/theme/colors';
import { Fab } from '@shared/ui';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg-base">
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg.base },
          tabBarActiveTintColor: colors.accent.default,
          tabBarInactiveTintColor: colors.content.muted,
          tabBarStyle: {
            backgroundColor: colors.bg.surface,
            borderTopColor: colors.hairline,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Acasă',
            tabBarIcon: ({ color, size }) => (
              <House color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ color, size }) => (
              <Activity color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Obiective',
            tabBarIcon: ({ color, size }) => (
              <Target color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="advisor"
          options={{
            title: 'Advisor',
            tabBarIcon: ({ color, size }) => (
              <Sparkles color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Setări',
            tabBarIcon: ({ color, size }) => (
              <Settings2 color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>

      <View
        pointerEvents="box-none"
        className="absolute right-5"
        style={{ bottom: insets.bottom + 74 }}
      >
        <Fab onPress={() => router.push('/event/new')} />
      </View>
    </View>
  );
}
