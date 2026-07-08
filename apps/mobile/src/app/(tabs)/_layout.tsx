import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Activity,
  House,
  Plus,
  Settings2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '@shared/api/me';
import { colors, elevation } from '@shared/theme/colors';
import { impactLight, selectionTick } from '@shared/lib/haptics';
import { PRESS_SCALE, springPress } from '@shared/theme/motion';

/** Icon + a short "bearing tick" pinned above it when the tab is active. */
function TabIcon({ focused, Icon }: { focused: boolean; Icon: LucideIcon }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 44 }}>
      <View
        style={{
          height: 2.5,
          width: 14,
          borderRadius: 2,
          marginBottom: 7,
          backgroundColor: focused ? colors.accent.default : 'transparent',
        }}
      />
      <Icon
        color={focused ? colors.accent.hover : colors.content.muted}
        size={22}
        strokeWidth={focused ? 2.3 : 2}
      />
    </View>
  );
}

/** The raised centre action — logs a new expense/event. Replaces the old floating FAB. */
function CenterAddButton() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const press = (to: number) => {
    if (reduceMotion) return;
    scale.value = withSpring(to, springPress);
  };
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Animated.View style={[elevation.hero, animated, { marginTop: -16, borderRadius: 27 }]}>
        <Pressable
          onPress={() => {
            impactLight();
            router.push('/event/new');
          }}
          onPressIn={() => press(PRESS_SCALE)}
          onPressOut={() => press(1)}
          accessibilityLabel="Adaugă o cheltuială"
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.accent.default,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
          }}
        >
          <Plus size={26} color={colors.content.primary} strokeWidth={2.6} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** The frosted glass slab — real glass, content actually frosts through it. */
function GlassBar() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16,15,24,0.45)' }]} />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: me } = useMe();

  // First-run gate: a freshly-registered user (onboardedAt null) is sent to the
  // onboarding flow before they can use the tabs. Existing users pass through.
  useEffect(() => {
    if (me && !me.onboardedAt) router.replace('/onboarding');
  }, [me, router]);

  return (
    <View className="flex-1 bg-bg-base">
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg.base },
          tabBarShowLabel: false,
          tabBarBackground: () => <GlassBar />,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 62 + insets.bottom,
            paddingTop: 10,
          },
          tabBarItemStyle: { height: 48 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Acasă',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={House} />,
          }}
          listeners={{ tabPress: () => selectionTick() }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Activity} />,
          }}
          listeners={{ tabPress: () => selectionTick() }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Adaugă',
            tabBarButton: () => <CenterAddButton />,
          }}
        />
        <Tabs.Screen
          name="advisor"
          options={{
            title: 'Advisor',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Sparkles} />,
          }}
          listeners={{ tabPress: () => selectionTick() }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Setări',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Settings2} />,
          }}
          listeners={{ tabPress: () => selectionTick() }}
        />
      </Tabs>
    </View>
  );
}
