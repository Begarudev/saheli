import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../../src/state/AppContext';
import { colors, radius, spacing, fonts } from '../../src/theme';

export default function PrivacyChoice() {
  const { updateSettings } = useApp();

  const chooseOpen = async () => {
    await updateSettings({ onboarded: true, privacyMode: false, coverId: null });
    router.replace('/saheli');
  };

  const chooseHidden = async () => {
    router.push('/onboarding/pick-cover');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.qHi}>क्या आपको Saheli को छिपाना है?</Text>
        <Text style={styles.q}>Hide Saheli behind a cover app?</Text>
        <Text style={styles.bodyTxt}>
          अगर आपका फ़ोन कोई और देखता है, तो Saheli को किसी और ऐप के पीछे छिपाया जा सकता है।
        </Text>
        <Text style={styles.bodyEn}>
          If someone else uses your phone, Saheli can be hidden behind another app.
        </Text>
      </View>
      <View style={{ gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          onPress={chooseOpen}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.primaryTxt}>नहीं, खुले में रखें · No, use openly</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={chooseHidden}
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.secondaryTxt}>हाँ, छिपाओ · Yes, hide it</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, padding: spacing.xl, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center' },
  qHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 28,
    lineHeight: 40,
    color: colors.indigo,
    marginBottom: 4,
  },
  q: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    color: colors.taupe,
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  bodyTxt: {
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
    lineHeight: 26,
    color: colors.inkTeal,
    marginBottom: spacing.md,
  },
  bodyEn: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.taupe,
  },
  primary: {
    backgroundColor: colors.indigo,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryTxt: {
    color: colors.cream,
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
  },
  secondary: {
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.2)',
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  secondaryTxt: {
    color: colors.indigo,
    fontFamily: fonts.hiDisplay,
    fontSize: 16,
  },
});
