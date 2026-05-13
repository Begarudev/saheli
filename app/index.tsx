import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../src/state/AppContext';
import { getCoverById } from '../src/covers';
import { colors } from '../src/theme';

export default function Index() {
  const { settings, settingsReady } = useApp();

  useEffect(() => {
    if (!settingsReady) return;
    if (!settings.onboarded) {
      router.replace('/onboarding/welcome');
      return;
    }
    if (!settings.privacyMode) {
      router.replace('/saheli');
      return;
    }
    const cover = getCoverById(settings.coverId);
    if (cover) {
      router.replace(cover.route as never);
    } else {
      // privacy mode on but no/invalid cover — fall back to Saheli rather
      // than crash.
      router.replace('/saheli');
    }
  }, [settingsReady, settings]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.indigo} />
    </View>
  );
}
