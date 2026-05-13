import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lotus } from '../../../src/components/Lotus';
import { DevUnlockShortcut } from '../../../src/components/DevUnlockShortcut';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { mantraOfTheDay, PANCHANG_PLACEHOLDER } from '../../../src/data/mantras';
import { useApp } from '../../../src/state/AppContext';

export default function CoverHome() {
  const m = useMemo(() => mantraOfTheDay(), []);
  const { registerOmTap, unlockToSaheli } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DevUnlockShortcut />
      <ImageBackground
        source={require('../../../assets/rangoli_festival.jpg')}
        style={styles.headerBg}
        imageStyle={{ opacity: 0.18 }}
      >
        <LinearGradient colors={[colors.crimson, colors.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <Text style={styles.brandHi}>सहेली</Text>
            <Text style={styles.brand}>Daily Mantras</Text>
            <Text style={styles.tagline}>आज का मंत्र · Mantra of the Day</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.lotusWrap}>
          <Lotus size={240} onTap={registerOmTap} onLongPress={unlockToSaheli} />
        </View>

        <View style={styles.mantraCard}>
          <Pressable onLongPress={unlockToSaheli} delayLongPress={4000}>
            <Text style={styles.deity}>{m.deity}</Text>
          </Pressable>
          <Text style={styles.devanagari}>{m.devanagari}</Text>
          <Text style={styles.translit}>{m.transliteration}</Text>
          <View style={styles.divider} />
          <Text style={styles.meaningHi}>{m.meaningHi}</Text>
          <Text style={styles.meaning}>{m.meaning}</Text>
        </View>

        <View style={styles.panchangCard}>
          <Text style={styles.panchangTitle}>आज का पंचांग · Today's Panchang</Text>
          <View style={styles.panchRow}>
            <PanchCell label="तिथि" value={PANCHANG_PLACEHOLDER.tithi} />
            <PanchCell label="वार" value={PANCHANG_PLACEHOLDER.vaar} />
          </View>
          <View style={styles.panchRow}>
            <PanchCell label="नक्षत्र" value={PANCHANG_PLACEHOLDER.nakshatra} />
            <PanchCell label="त्योहार" value={PANCHANG_PLACEHOLDER.festival} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PanchCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.panchCell}>
      <Text style={styles.panchLabel}>{label}</Text>
      <Text style={styles.panchValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBg: { paddingBottom: spacing.lg },
  headerInner: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  brandHi: { fontSize: 30, fontWeight: '800', color: colors.cream, letterSpacing: 1 },
  brand: { fontSize: 14, color: colors.saffron, letterSpacing: 3, marginTop: -4 },
  tagline: { ...typography.small, marginTop: 6, color: colors.cream },
  lotusWrap: { alignItems: 'center', marginTop: -32, marginBottom: spacing.lg },
  mantraCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deity: { color: colors.saffron, fontSize: 12, letterSpacing: 3, fontWeight: '700' },
  devanagari: { ...typography.devanagari, marginTop: 8, lineHeight: 32 },
  translit: { ...typography.body, fontWeight: '400', marginTop: 8, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  meaningHi: { ...typography.body, color: colors.cream, marginBottom: 4 },
  meaning: { fontSize: 12, color: colors.textMuted, fontWeight: '400', lineHeight: 18 },
  panchangCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panchangTitle: { color: colors.saffron, fontSize: 13, letterSpacing: 2, fontWeight: '700', marginBottom: spacing.md },
  panchRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  panchCell: { flex: 1, backgroundColor: colors.cardSoft, padding: spacing.md, borderRadius: radius.md },
  panchLabel: { ...typography.small, color: colors.saffron },
  panchValue: { ...typography.body, marginTop: 2 },
});
