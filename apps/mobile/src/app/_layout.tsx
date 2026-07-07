import '../global.css';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import {
  SplineSansMono_400Regular,
  SplineSansMono_500Medium,
  SplineSansMono_600SemiBold,
} from '@expo-google-fonts/spline-sans-mono';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuth } from '@shared/auth/store';
import { usePrefs } from '@shared/settings/store';
import { Providers } from '@shared/providers';
import { colors } from '@shared/theme/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SplineSansMono_400Regular,
    SplineSansMono_500Medium,
    SplineSansMono_600SemiBold,
  });

  const status = useAuth((s) => s.status);
  const hydrate = useAuth((s) => s.hydrate);
  const hydratePrefs = usePrefs((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate();
    hydratePrefs();
  }, [hydrate, hydratePrefs]);

  useEffect(() => {
    if (!loaded || status === 'loading') return;
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    const onLock = segments[1] === 'lock';
    if (status === 'guest' && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (status === 'locked' && !onLock) {
      router.replace('/(auth)/lock');
    } else if (status === 'authed' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [loaded, status, segments, router]);

  if (!loaded || status === 'loading') return null;

  return (
    <Providers>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: '',
          contentStyle: { backgroundColor: colors.bg.base },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="event/new"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="event/scan"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="account/new"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="account/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="goal/new"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="goal/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="simulate"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="import"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="ips"
          options={{
            headerShown: true,
            title: 'Reguli IPS',
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.accent.default,
            headerTitleStyle: {
              fontFamily: 'SpaceGrotesk_600SemiBold',
              color: colors.content.primary,
            },
          }}
        />
        <Stack.Screen
          name="discipline"
          options={{
            headerShown: true,
            title: 'Discipline Score',
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.accent.default,
            headerTitleStyle: {
              fontFamily: 'SpaceGrotesk_600SemiBold',
              color: colors.content.primary,
            },
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            headerShown: true,
            title: 'Obiective',
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.accent.default,
            headerTitleStyle: {
              fontFamily: 'SpaceGrotesk_600SemiBold',
              color: colors.content.primary,
            },
          }}
        />
        <Stack.Screen
          name="board"
          options={{
            headerShown: true,
            title: 'Board Meeting',
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.accent.default,
            headerTitleStyle: {
              fontFamily: 'SpaceGrotesk_600SemiBold',
              color: colors.content.primary,
            },
          }}
        />
        <Stack.Screen
          name="recurring/index"
          options={{
            headerShown: true,
            title: 'Plăți recurente',
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.accent.default,
            headerTitleStyle: {
              fontFamily: 'SpaceGrotesk_600SemiBold',
              color: colors.content.primary,
            },
          }}
        />
        <Stack.Screen
          name="recurring/new"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </Providers>
  );
}
