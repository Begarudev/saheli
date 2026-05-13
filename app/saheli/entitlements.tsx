import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { QuickExitButton } from '../../src/components/QuickExitButton';
import { colors, radius, spacing, typography, fonts } from '../../src/theme';
import { SCHEMES, STATES_UTS, matchSchemes, type Scheme, type ProfileInput } from '../../src/data/schemes';
import { loadProfile, saveProfile, parseOcrText, type OcrParsed } from '../../src/services/profile';
import { ocr } from '../../src/services/sarvam';
import { redactPII } from '../../src/services/pii';

const CATEGORIES: Array<'General' | 'OBC' | 'SC' | 'ST'> = ['General', 'OBC', 'SC', 'ST'];

export default function EntitlementsScreen() {
  const [profile, setProfile] = useState<ProfileInput>({ pregnantOrLactating: false });
  const [stateOpen, setStateOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrModal, setOcrModal] = useState<{ open: boolean; text: string; parsed: OcrParsed } | null>(null);

  useEffect(() => {
    loadProfile().then((p) => {
      setProfile((prev) => ({ ...prev, ...p }));
    });
  }, []);

  const persist = useCallback((next: ProfileInput) => {
    setProfile(next);
    saveProfile(next).catch(() => {});
  }, []);

  const results = useMemo(() => matchSchemes(profile), [profile]);

  const onScan = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('अनुमति चाहिए', 'कैमरा अनुमति दें ताकि कार्ड स्कैन हो सके।');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (res.canceled || !res.assets?.[0]) return;
      setScanning(true);
      const rawText = await ocr(res.assets[0].uri);
      // Parse structured fields from RAW text (so age / DOB detection still works),
      // but only ever surface / persist the redacted version.
      const parsed = parseOcrText(rawText);
      const { redacted } = redactPII(rawText);
      setScanning(false);
      if (!rawText && !Object.keys(parsed).length) {
        Alert.alert('स्कैन', 'स्कैन से जानकारी नहीं मिली, हाथ से भरें।');
        return;
      }
      setOcrModal({ open: true, text: redacted, parsed });
    } catch (e) {
      setScanning(false);
      console.warn('[entitlements.scan]', e);
      Alert.alert('स्कैन', 'स्कैन से जानकारी नहीं मिली, हाथ से भरें।');
    }
  };

  const useOcr = () => {
    if (!ocrModal) return;
    const p = ocrModal.parsed;
    const next: ProfileInput = { ...profile };
    if (typeof p.age === 'number') next.age = p.age;
    // gender: app is for women — just don't override
    setOcrModal(null);
    persist(next);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>योजना</Text>
          <Text style={styles.sub}>Government schemes you may qualify for</Text>
        </View>
        <QuickExitButton />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 64 }}>
        <Pressable style={styles.scanBtn} onPress={onScan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator color={colors.cream} />
          ) : (
            <Text style={styles.scanBtnText}>आधार/राशन कार्ड स्कैन करें</Text>
          )}
        </Pressable>
        <Text style={styles.privacy}>
          आपका आधार नंबर इस फ़ोन में संग्रहीत नहीं होता।
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>अपनी जानकारी भरें</Text>

          <Text style={styles.label}>आयु (वर्ष)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="जैसे 28"
            placeholderTextColor={colors.taupe}
            value={profile.age?.toString() ?? ''}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              persist({ ...profile, age: Number.isNaN(n) ? undefined : n });
            }}
          />

          <Text style={styles.label}>मासिक आय (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="जैसे 12000"
            placeholderTextColor={colors.taupe}
            value={profile.income?.toString() ?? ''}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              persist({ ...profile, income: Number.isNaN(n) ? undefined : n });
            }}
          />

          <Text style={styles.label}>राज्य / केंद्र शासित प्रदेश</Text>
          <Pressable style={styles.input} onPress={() => setStateOpen(true)}>
            <Text style={{ color: profile.state ? colors.indigo : colors.taupe, fontFamily: fonts.body, fontSize: 15 }}>
              {profile.state ?? 'चुनें'}
            </Text>
          </Pressable>

          <Text style={styles.label}>श्रेणी</Text>
          <View style={styles.row}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, profile.category === c && styles.chipActive]}
                onPress={() => persist({ ...profile, category: c })}
              >
                <Text style={[styles.chipText, profile.category === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>क्या आप गर्भवती / स्तनपान कराने वाली हैं?</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.chip, profile.pregnantOrLactating === true && styles.chipActive]}
              onPress={() => persist({ ...profile, pregnantOrLactating: true })}
            >
              <Text style={[styles.chipText, profile.pregnantOrLactating === true && styles.chipTextActive]}>
                हाँ
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, profile.pregnantOrLactating === false && styles.chipActive]}
              onPress={() => persist({ ...profile, pregnantOrLactating: false })}
            >
              <Text style={[styles.chipText, profile.pregnantOrLactating === false && styles.chipTextActive]}>
                नहीं
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.matchHeader}>
          {results.length} योजनाएँ मिलीं ({SCHEMES.length} में से)
        </Text>

        {results.map((s) => (
          <SchemeCard key={s.id} scheme={s} />
        ))}

        {results.length === 0 && (
          <Text style={styles.empty}>कोई योजना नहीं मिली। कृपया अपनी जानकारी जाँचें।</Text>
        )}
      </ScrollView>

      {/* State picker modal */}
      <Modal visible={stateOpen} animationType="slide" onRequestClose={() => setStateOpen(false)}>
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.h2}>राज्य चुनें</Text>
            <Pressable onPress={() => setStateOpen(false)}>
              <Text style={styles.close}>बंद</Text>
            </Pressable>
          </View>
          <FlatList
            data={STATES_UTS}
            keyExtractor={(it) => it}
            renderItem={({ item }) => (
              <Pressable
                style={styles.stateRow}
                onPress={() => {
                  persist({ ...profile, state: item });
                  setStateOpen(false);
                }}
              >
                <Text style={[styles.stateText, profile.state === item && { color: colors.indigo, fontFamily: fonts.bodyBold }]}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* OCR result modal */}
      <Modal
        visible={!!ocrModal?.open}
        animationType="slide"
        transparent
        onRequestClose={() => setOcrModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.ocrSheet}>
            <Text style={styles.h2}>स्कैन परिणाम</Text>
            {ocrModal?.parsed.age != null && (
              <Text style={styles.ocrLine}>आयु: {ocrModal.parsed.age}</Text>
            )}
            {ocrModal?.parsed.dob && (
              <Text style={styles.ocrLine}>DOB: {ocrModal.parsed.dob}</Text>
            )}
            {ocrModal?.parsed.gender && (
              <Text style={styles.ocrLine}>लिंग: {ocrModal.parsed.gender === 'F' ? 'महिला' : 'पुरुष'}</Text>
            )}
            {ocrModal?.parsed.aadhaarLast4 && (
              <Text style={styles.ocrLine}>आधार (अंतिम 4): xxxx-xxxx-{ocrModal.parsed.aadhaarLast4}</Text>
            )}
            {ocrModal?.parsed.name && (
              <Text style={styles.ocrLine}>नाम: {ocrModal.parsed.name}</Text>
            )}
            <ScrollView style={{ maxHeight: 160, marginTop: spacing.sm }}>
              <Text style={styles.rawText}>{ocrModal?.text || '(कोई पाठ नहीं)'}</Text>
            </ScrollView>
            <View style={[styles.row, { marginTop: spacing.md }]}>
              <Pressable style={[styles.chip, styles.chipActive]} onPress={useOcr}>
                <Text style={styles.chipTextActive}>उपयोग करें</Text>
              </Pressable>
              <Pressable style={styles.chip} onPress={() => setOcrModal(null)}>
                <Text style={styles.chipText}>रद्द करें</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SchemeCard({ scheme }: { scheme: Scheme }) {
  return (
    <View style={styles.scheme}>
      <Text style={styles.schemeHi}>{scheme.nameHi}</Text>
      <Text style={styles.schemeEn}>{scheme.name}</Text>
      <Text style={styles.ministry}>{scheme.ministry}</Text>
      <Text style={styles.summary}>{scheme.summaryHi}</Text>
      <View style={[styles.row, { marginTop: spacing.sm, alignItems: 'center' }]}>
        <View style={styles.benefitChip}>
          <Text style={styles.benefitText}>{scheme.benefit}</Text>
        </View>
        <Pressable
          style={styles.applyBtn}
          onPress={() => Linking.openURL(scheme.applyUrl).catch(() => {})}
        >
          <Text style={styles.applyText}>और जानें ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm,
    gap: spacing.md,
    borderBottomColor: 'rgba(28, 36, 84, 0.1)', borderBottomWidth: 1,
  },
  h1: { ...typography.h1, fontSize: 28 },
  h2: { ...typography.h2 },
  sub: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    marginTop: 2,
  },
  scanBtn: {
    backgroundColor: colors.indigo,
    padding: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scanBtnText: {
    color: colors.cream,
    fontFamily: fonts.hiDisplay,
    fontSize: 17,
  },
  privacy: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.taupe,
    marginBottom: spacing.lg,
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.12)',
    marginBottom: spacing.lg,
  },
  formTitle: { ...typography.h2, marginBottom: spacing.sm },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    color: colors.taupe,
  },
  input: {
    backgroundColor: colors.cream,
    color: colors.indigo,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)', backgroundColor: colors.cream,
  },
  chipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipText: { color: colors.taupe, fontFamily: fonts.body, fontSize: 13 },
  chipTextActive: { color: colors.cream, fontFamily: fonts.bodyBold, fontSize: 13 },
  matchHeader: {
    ...typography.h2,
    marginBottom: spacing.md,
    color: colors.indigo,
  },
  scheme: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  schemeHi: {
    fontFamily: fonts.hiDisplay,
    fontSize: 18,
    color: colors.indigo,
    lineHeight: 26,
  },
  schemeEn: {
    fontFamily: fonts.enDisplayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.taupe,
    marginTop: 2,
  },
  ministry: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.taupe,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkTeal,
    marginTop: spacing.sm,
  },
  benefitChip: {
    backgroundColor: colors.indigo,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  benefitText: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  applyBtn: {
    marginLeft: 'auto',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.indigo,
    borderRadius: radius.pill,
  },
  applyText: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomColor: 'rgba(28, 36, 84, 0.1)', borderBottomWidth: 1,
  },
  close: { color: colors.indigo, fontFamily: fonts.bodyBold, fontSize: 14 },
  stateRow: { padding: spacing.lg, borderBottomColor: 'rgba(28, 36, 84, 0.08)', borderBottomWidth: 1 },
  stateText: { ...typography.body },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(28, 36, 84, 0.6)', justifyContent: 'flex-end' },
  ocrSheet: {
    backgroundColor: colors.cream,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 36, 84, 0.15)',
  },
  ocrLine: { ...typography.body, marginTop: spacing.xs },
  rawText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.taupe,
    lineHeight: 16,
  },
});
