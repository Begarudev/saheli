import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useApp } from '../../src/state/AppContext';
import { COVERS, type CoverDef, type CoverIconKey } from '../../src/covers';
import { colors, radius, spacing, fonts } from '../../src/theme';

// Per-cover accent stripe color, so the user previews each cover's identity.
const COVER_ACCENT: Record<string, string> = {
  mantras: '#f59e0b',  // saffron
  duas: '#d4a24c',     // gold
  cycle: '#7c5cff',    // violet
};

function CoverIcon({ kind, size = 36, color = colors.indigo }: { kind: CoverIconKey; size?: number; color?: string }) {
  if (kind === 'lotus') {
    return (
      <Svg width={size} height={size} viewBox="-50 -50 100 100">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Path
            key={i}
            d="M0,-40 C15,-25 15,-10 0,0 C-15,-10 -15,-25 0,-40 Z"
            fill={color}
            opacity={0.85}
            transform={`rotate(${i * 60})`}
          />
        ))}
        <Circle cx={0} cy={0} r={6} fill={colors.sindoor} />
      </Svg>
    );
  }
  if (kind === 'cycle') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Circle cx={24} cy={24} r={18} stroke={color} strokeWidth={2.5} strokeDasharray="6 4" />
        <Circle cx={24} cy={24} r={4} fill={color} />
      </Svg>
    );
  }
  if (kind === 'crescent') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M32 8 A18 18 0 1 0 32 40 A14 14 0 1 1 32 8 Z" fill={color} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d="M10 14 H38 L34 38 H14 Z" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}

export default function PickCover() {
  const { updateSettings } = useApp();
  const [pending, setPending] = useState<CoverDef | null>(null);

  const choose = (cover: CoverDef) => setPending(cover);

  const confirm = async () => {
    if (!pending) return;
    await updateSettings({ onboarded: true, privacyMode: true, coverId: pending.id });
    const route = pending.route;
    setPending(null);
    router.replace(route as never);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.titleHi}>आवरण चुनें</Text>
        <Text style={styles.title}>Pick a cover</Text>
        <Text style={styles.sub}>
          Saheli किस ऐप के पीछे छिपेगी? · Which app should Saheli hide behind?
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingTop: spacing.md }}>
        {COVERS.map((cover) => {
          const accent = COVER_ACCENT[cover.id] ?? colors.indigo;
          return (
            <Pressable
              key={cover.id}
              onPress={() => choose(cover)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.accent, { backgroundColor: accent }]} />
              <View style={styles.iconBox}>
                <CoverIcon kind={cover.iconKey} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHi}>{cover.nameHi}</Text>
                <Text style={styles.cardEn}>{cover.name}</Text>
                <Text style={styles.cardDesc}>{cover.descriptionHi}</Text>
                <Text style={styles.cardDescEn}>{cover.description}</Text>
                <Text style={styles.audience}>{cover.audience}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal visible={!!pending} transparent animationType="fade" onRequestClose={() => setPending(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitleHi}>गुप्त इशारे · Covert gestures</Text>
            <Text style={styles.modalSub}>
              इन इशारों से आप Saheli पर वापस आ सकती हैं। याद रखें।
            </Text>
            <Text style={styles.modalSubEn}>Use these gestures to come back to Saheli. Remember them.</Text>
            <ScrollView style={{ maxHeight: 240, marginTop: spacing.md }}>
              {pending?.gesturesHi.map((g, i) => (
                <View key={i} style={styles.gestureRow}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gestureHi}>{g}</Text>
                    {pending.gestures[i] ? <Text style={styles.gestureEn}>{pending.gestures[i]}</Text> : null}
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <Pressable onPress={() => setPending(null)} style={[styles.modalBtn, styles.modalBtnGhost]}>
                <Text style={styles.modalBtnGhostTxt}>रद्द · Cancel</Text>
              </Pressable>
              <Pressable onPress={confirm} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                <Text style={styles.modalBtnPrimaryTxt}>समझ गई · Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  head: { padding: spacing.xl, paddingBottom: spacing.lg },
  titleHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 28,
    lineHeight: 40,
    color: colors.indigo,
  },
  title: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    color: colors.taupe,
    fontSize: 13,
    marginTop: 2,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkTeal,
    marginTop: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.lg,
    paddingLeft: spacing.lg + 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 20,
    color: colors.indigo,
    lineHeight: 28,
  },
  cardEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    color: colors.taupe,
    fontSize: 13,
    marginTop: 2,
  },
  cardDesc: {
    fontFamily: fonts.hiDisplay,
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkTeal,
    marginTop: spacing.sm,
  },
  cardDescEn: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.taupe,
    marginTop: 2,
  },
  audience: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.taupe,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(28, 36, 84, 0.7)', justifyContent: 'center', padding: spacing.lg },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.2)',
    padding: spacing.xl,
  },
  modalTitleHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 22,
    color: colors.indigo,
  },
  modalSub: {
    fontFamily: fonts.hiDisplay,
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkTeal,
    marginTop: spacing.sm,
  },
  modalSubEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.taupe,
    marginTop: 2,
  },
  gestureRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  bullet: { color: colors.indigo, fontSize: 16, lineHeight: 22 },
  gestureHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 14,
    lineHeight: 22,
    color: colors.indigo,
  },
  gestureEn: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.taupe,
    marginTop: 2,
  },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center' },
  modalBtnPrimary: { backgroundColor: colors.indigo },
  modalBtnPrimaryTxt: {
    color: colors.cream,
    fontFamily: fonts.hiDisplay,
    fontSize: 15,
  },
  modalBtnGhost: {
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.2)',
  },
  modalBtnGhostTxt: {
    color: colors.indigo,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
