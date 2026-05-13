import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlockPrintDivider } from '../../src/components/BlockPrintDivider';
import { colors, radius, spacing, fonts } from '../../src/theme';

export default function Welcome() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.brandHi}>नमस्ते।{'\n'}मैं सहेली हूँ।</Text>
        <Text style={styles.brandEn}>Hello. I'm Saheli.</Text>
        <View style={{ paddingVertical: spacing.xl }}>
          <BlockPrintDivider horizontalPadding={spacing.xl} />
        </View>
        <Text style={styles.taglineHi}>
          अधिकार · सुरक्षा · सेहत · योजनाएँ
        </Text>
        <Text style={styles.tagline}>
          For every Indian woman — rights, safety, health, schemes.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/onboarding/privacy')}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.ctaTxt}>आगे बढ़ें · Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, padding: spacing.xl, justifyContent: 'space-between' },
  body: { flex: 1, alignItems: 'flex-start', justifyContent: 'center' },
  brandHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 44,
    lineHeight: 56,
    color: colors.indigo,
  },
  brandEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 16,
    color: colors.taupe,
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  taglineHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 20,
    lineHeight: 30,
    color: colors.inkTeal,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: colors.indigo,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaTxt: {
    color: colors.cream,
    fontFamily: fonts.hiDisplay,
    fontSize: 18,
  },
});
