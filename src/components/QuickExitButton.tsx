import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, fonts } from '../theme';
import { useApp } from '../state/AppContext';

export function QuickExitButton() {
  const { quickExit, settings } = useApp();
  // Without privacy mode there's no cover to exit to — Saheli is the front
  // door. Render nothing so the UI matches the open-product framing.
  if (!settings.privacyMode) return null;
  return (
    <Pressable
      onPress={quickExit}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
      accessibilityLabel="Quick exit"
    >
      <Text style={styles.txt}>✕  EXIT</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    // Quick-exit IS distress (escape monitored phone) — sindoor is correct here.
    backgroundColor: colors.sindoor,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  txt: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
  },
});
