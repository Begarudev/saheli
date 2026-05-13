import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useApp } from '../../../src/state/AppContext';
import { DevUnlockShortcut } from '../../../src/components/DevUnlockShortcut';
import { useStealthSOSGesture } from '../../../src/hooks/useStealthSOSGesture';
import { duaOfTheDay, NAMAZ_TIMES_PLACEHOLDER } from '../../../src/data/duas';
import { duasColors as c } from '../../../src/covers/themes/duas';

const TASBIH_KEY = 'cover.duas.tasbih';
const TASBIH_TARGET = 33;

function CrescentMark({ size = 28, color = c.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M32 8 A18 18 0 1 0 32 40 A14 14 0 1 1 32 8 Z"
        fill={color}
      />
    </Svg>
  );
}

function TasbihRing({ count, total, size = 220 }: { count: number; total: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cir = 2 * Math.PI * r;
  const offset = cir * (1 - count / total);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.ring} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={c.accent}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={cir}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export default function DuasHome() {
  const dua = useMemo(() => duaOfTheDay(), []);
  const { registerTrackerTap } = useApp();

  const [count, setCount] = useState(0);
  const [showAck, setShowAck] = useState(false);

  const ackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleStealthSOS = useStealthSOSGesture();

  const scale = useSharedValue(1);
  const beadStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    AsyncStorage.getItem(TASBIH_KEY).then((v) => {
      if (v) {
        const n = parseInt(v, 10);
        if (!Number.isNaN(n) && n >= 0 && n <= TASBIH_TARGET) setCount(n);
      }
    });
    return () => {
      if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
    };
  }, []);

  const onBeadTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // tactile spring
    scale.value = withSpring(0.92, { damping: 10, stiffness: 320 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 260 });
    });

    setCount((prev) => {
      const next = prev + 1;
      if (next >= TASBIH_TARGET) {
        AsyncStorage.setItem(TASBIH_KEY, '0');
        setShowAck(true);
        if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
        ackTimerRef.current = setTimeout(() => setShowAck(false), 1800);
        return 0;
      }
      AsyncStorage.setItem(TASBIH_KEY, String(next));
      return next;
    });

    // Covert detectors — both fed every tap. Burst-pattern unlock fires on
    // the [1, 8, 1] rhythm; stealth SOS fires on 5 rapid taps + trailing pause.
    registerTrackerTap();
    handleStealthSOS();
  }, [registerTrackerTap, scale, handleStealthSOS]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <DevUnlockShortcut />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.head}>
          <View style={styles.brandRow}>
            <CrescentMark size={26} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.brandHi}>दैनिक दुआ</Text>
              <Text style={styles.brand}>Daily Duas</Text>
            </View>
          </View>
          <Text style={styles.bismillah} allowFontScaling>
            <Text style={styles.bismillahAr}>بِسْمِ ٱللَّٰهِ</Text>
            <Text style={styles.bismillahDot}>  ·  </Text>
            <Text style={styles.bismillahLat}>Bismillah</Text>
          </Text>
        </View>

        {/* Today's Dua card */}
        <View style={styles.duaCard}>
          <Text style={styles.cardEyebrow}>{dua.occasionHi} · {dua.occasion}</Text>
          <Text style={styles.arabic}>{dua.arabic}</Text>
          <Text style={styles.translit}>{dua.transliteration}</Text>
          <View style={styles.divider} />
          <Text style={styles.meaningHi}>{dua.meaningHi}</Text>
          <Text style={styles.meaningEn}>{dua.meaningEn}</Text>
          {dua.source ? <Text style={styles.source}>— {dua.source}</Text> : null}
        </View>

        {/* Tasbih counter — covert tap surface */}
        <View style={styles.tasbihWrap}>
          <View style={styles.ringStack}>
            <TasbihRing count={count} total={TASBIH_TARGET} />
            <Pressable
              onPress={onBeadTap}
              accessibilityLabel="Tasbih bead"
              accessibilityRole="button"
              style={styles.beadHit}
            >
              <Animated.View style={[styles.bead, beadStyle]}>
                <Text style={styles.beadCount}>{count}</Text>
                <Text style={styles.beadOf}>of {TASBIH_TARGET}</Text>
              </Animated.View>
            </Pressable>
          </View>
          <Text style={styles.tasbihCaption}>तसबीह · Tasbih · 33</Text>
          {showAck ? (
            <Text style={styles.ack}>سُبْحَانَ ٱللَّٰه · Subhan’Allah</Text>
          ) : (
            <Text style={styles.ackPlaceholder} />
          )}
        </View>

        {/* Namaz times */}
        <View style={styles.namazCard}>
          <Text style={styles.namazTitle}>नमाज़ का समय · Today's Prayer Times</Text>
          {NAMAZ_TIMES_PLACEHOLDER.map((p) => (
            <View key={p.name} style={styles.namazRow}>
              <Text style={styles.namazNameHi}>{p.nameHi}</Text>
              <Text style={styles.namazName}>{p.name}</Text>
              <Text style={styles.namazTime}>{p.time}</Text>
            </View>
          ))}
          <Text style={styles.namazNote}>Sample times — set your city in Settings.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandHi: { fontSize: 22, fontWeight: '800', color: c.cream, letterSpacing: 0.5 },
  brand: { fontSize: 11, color: c.accent, letterSpacing: 3, fontWeight: '700', marginTop: -2 },
  bismillah: { marginTop: 12 },
  bismillahAr: { fontSize: 18, color: c.cream, writingDirection: 'rtl' },
  bismillahDot: { color: c.accentMuted, fontSize: 14 },
  bismillahLat: { fontSize: 12, color: c.textMuted, letterSpacing: 2 },

  duaCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardEyebrow: {
    fontSize: 11,
    color: c.accent,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  arabic: {
    fontSize: 26,
    color: c.cream,
    marginTop: 14,
    lineHeight: 44,
    writingDirection: 'rtl',
    textAlign: 'right',
    fontWeight: '600',
  },
  translit: {
    fontSize: 13,
    color: c.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 14 },
  meaningHi: { fontSize: 14, color: c.cream, lineHeight: 22 },
  meaningEn: { fontSize: 12, color: c.textMuted, lineHeight: 18, marginTop: 4 },
  source: { fontSize: 11, color: c.accentMuted, marginTop: 10, fontStyle: 'italic' },

  tasbihWrap: { alignItems: 'center', marginTop: 28 },
  ringStack: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  beadHit: { position: 'absolute', width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  bead: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: c.cardSoft,
    borderWidth: 2,
    borderColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beadCount: { fontSize: 52, fontWeight: '800', color: c.accent, lineHeight: 56 },
  beadOf: { fontSize: 11, color: c.textMuted, letterSpacing: 2, marginTop: 2 },
  tasbihCaption: {
    marginTop: 16,
    fontSize: 12,
    color: c.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },
  ack: { marginTop: 8, fontSize: 14, color: c.accent, fontWeight: '700' },
  ackPlaceholder: { marginTop: 8, height: 18 },

  namazCard: {
    margin: 20,
    marginTop: 28,
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: c.border,
  },
  namazTitle: {
    fontSize: 12,
    color: c.accent,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  namazRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  namazNameHi: { width: 80, color: c.cream, fontSize: 14, fontWeight: '600' },
  namazName: { flex: 1, color: c.textMuted, fontSize: 12, letterSpacing: 1 },
  namazTime: { color: c.accent, fontSize: 15, fontWeight: '700' },
  namazNote: { fontSize: 11, color: c.textMuted, fontStyle: 'italic', marginTop: 10 },
});
