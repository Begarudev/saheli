import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { colors, spacing, typography, fonts } from '../../src/theme';

export default function ComingSoon() {
  return (
    <>
      <Stack.Screen options={{ title: 'Coming soon' }} />
      <View style={styles.wrap}>
        <Text style={styles.title}>जल्द आ रहा है</Text>
        <Text style={styles.titleEn}>Coming soon</Text>
        <Text style={styles.sub}>This module ships in wave 2. Evidence Vault is live now.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.cream },
  title: { ...typography.h1, marginBottom: spacing.xs, textAlign: 'center' },
  titleEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.taupe,
    marginBottom: spacing.lg,
  },
  sub: { ...typography.body, textAlign: 'center', color: colors.taupe },
});
