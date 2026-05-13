import React, { useCallback, useEffect } from 'react';
import { Stack, usePathname, router } from 'expo-router';
import { BackHandler } from 'react-native';
import { useApp } from '../../src/state/AppContext';
import { useShakeExit } from '../../src/hooks/useShakeExit';
import { colors, fonts } from '../../src/theme';

export default function SaheliLayout() {
  const { quickExit, settings } = useApp();
  const exit = useCallback(() => quickExit(), [quickExit]);
  // Shake-to-exit only meaningful when privacy mode is ON. In open mode
  // Saheli is the front door — no cover to exit to.
  useShakeExit(exit, settings.privacyMode);
  const pathname = usePathname();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Only intercept hardware back at the Saheli dashboard root —
      // there, back means "leave Saheli, return to cover".
      // On any sub-screen (vault, rights, safety, etc.), let the default
      // stack pop happen by returning false.
      const atRoot = pathname === '/saheli' || pathname === '/saheli/';
      if (atRoot) {
        exit();
        return true;
      }
      // Fallback: if router can't go back (unusual), still snap to cover
      // so the user is never stranded.
      if (!router.canGoBack?.()) {
        exit();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [exit, pathname]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.indigo,
        headerTitleStyle: { fontFamily: fonts.hiDisplay, fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="vault" options={{ title: 'सबूत तिजोरी · Evidence Vault' }} />
      <Stack.Screen name="rights" options={{ title: 'अधिकार · Rights' }} />
      <Stack.Screen name="safety" options={{ title: 'सुरक्षा · Safety Net' }} />
      <Stack.Screen name="entitlements" options={{ title: 'योजना · Entitlements' }} />
      <Stack.Screen name="health" options={{ title: 'सेहत · Health' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings · सेटिंग्स' }} />
    </Stack>
  );
}
