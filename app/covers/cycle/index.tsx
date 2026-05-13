import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { useApp } from '../../../src/state/AppContext';
import { DevUnlockShortcut } from '../../../src/components/DevUnlockShortcut';
import { useStealthSOSGesture } from '../../../src/hooks/useStealthSOSGesture';
import { cycleColors as c } from '../../../src/covers/themes/cycle';

const LAST_LOG_KEY = 'cover.cycle.lastLog';
const MOOD_KEY = 'cover.cycle.mood';
const DAY_OF_CYCLE_KEY = 'cover.cycle.day';
const CYCLE_LEN = 28;

type MoodId = 'happy' | 'calm' | 'tired' | 'cramps' | 'sad';

function MoodFace({ id, size = 36, color = c.text }: { id: MoodId; size?: number; color?: string }) {
  // 5 distinct line-art faces. No emoji — simple SVG.
  const cx = 24, cy = 24;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx={cx} cy={cy} r={20} stroke={color} strokeWidth={2} />
      <Circle cx={17} cy={20} r={1.6} fill={color} />
      <Circle cx={31} cy={20} r={1.6} fill={color} />
      {id === 'happy' && (
        <Path d="M16 28 Q24 36 32 28" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      )}
      {id === 'calm' && (
        <Path d="M16 30 H32" stroke={color} strokeWidth={2} strokeLinecap="round" />
      )}
      {id === 'tired' && (
        <>
          <Path d="M16 30 Q24 26 32 30" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M14 18 L20 22" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M28 22 L34 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {id === 'cramps' && (
        <Path d="M16 32 Q20 28 24 32 Q28 36 32 32" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      )}
      {id === 'sad' && (
        <Path d="M16 32 Q24 24 32 32" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      )}
    </Svg>
  );
}

const MOODS: { id: MoodId; label: string }[] = [
  { id: 'happy', label: 'Happy' },
  { id: 'calm', label: 'Calm' },
  { id: 'tired', label: 'Tired' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'sad', label: 'Sad' },
];

function ProgressRing({ day, total, size = 220 }: { day: number; total: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cir = 2 * Math.PI * r;
  const offset = cir * (1 - day / total);
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

export default function CycleHome() {
  const { registerTrackerTap } = useApp();
  const [day, setDay] = useState(1);
  const [mood, setMood] = useState<MoodId | null>(null);
  const [lastLog, setLastLog] = useState<string | null>(null);

  const handleStealthSOS = useStealthSOSGesture();

  useEffect(() => {
    AsyncStorage.multiGet([DAY_OF_CYCLE_KEY, MOOD_KEY, LAST_LOG_KEY]).then((kvs) => {
      const map = Object.fromEntries(kvs);
      const d = parseInt(map[DAY_OF_CYCLE_KEY] ?? '', 10);
      if (!Number.isNaN(d) && d > 0) setDay(d);
      else setDay(((Math.floor(Date.now() / 86400000)) % CYCLE_LEN) + 1);
      const m = map[MOOD_KEY] as MoodId | undefined;
      if (m) setMood(m);
      setLastLog(map[LAST_LOG_KEY] ?? null);
    });
  }, []);

  const onLogToday = useCallback(() => {
    const now = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const stamp = new Date(now).toISOString().slice(0, 10);
    setLastLog(stamp);
    AsyncStorage.setItem(LAST_LOG_KEY, stamp);
    // Advance day-of-cycle on log (gentle, plausible behavior).
    const nextDay = day >= CYCLE_LEN ? 1 : day + 1;
    setDay(nextDay);
    AsyncStorage.setItem(DAY_OF_CYCLE_KEY, String(nextDay));

    // Covert detectors — both fed every tap. Burst-pattern unlock fires on
    // the [1, 8, 1] rhythm; stealth SOS fires on 5 rapid taps + trailing pause.
    registerTrackerTap();
    handleStealthSOS();
  }, [day, registerTrackerTap, handleStealthSOS]);

  const onMood = (m: MoodId) => {
    setMood(m);
    AsyncStorage.setItem(MOOD_KEY, m);
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <DevUnlockShortcut />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.head}>
          <Text style={styles.brand}>Cycle & Wellness</Text>
          <Text style={styles.brandHi}>मासिक चक्र</Text>
        </View>

        <View style={styles.ringWrap}>
          <ProgressRing day={day} total={CYCLE_LEN} />
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={styles.ringLabel}>Day</Text>
            <Text style={styles.ringDay}>{day}</Text>
            <Text style={styles.ringTotal}>of {CYCLE_LEN}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log today"
          onPress={onLogToday}
          style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.logBtnTxt}>Log today</Text>
          <Text style={styles.logBtnSub}>{lastLog ? `Last logged · ${lastLog}` : 'Not logged yet'}</Text>
        </Pressable>

        <View style={styles.moodCard}>
          <Text style={styles.cardTitle}>How do you feel?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const active = mood === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => onMood(m.id)}
                  accessibilityLabel={m.label}
                  style={[styles.moodBtn, active && styles.moodBtnActive]}
                >
                  <MoodFace id={m.id} color={active ? c.accent : c.text} />
                  <Text style={[styles.moodLabel, active && { color: c.accent, fontWeight: '700' }]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.cardTitle}>Today</Text>
          <Text style={styles.tipBody}>Track your cycle. Notice patterns. Stay informed.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  brand: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: 0.5 },
  brandHi: { fontSize: 14, color: c.accent, marginTop: 2, letterSpacing: 1 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 24, position: 'relative' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringLabel: { fontSize: 12, color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  ringDay: { fontSize: 56, fontWeight: '800', color: c.accent, lineHeight: 60 },
  ringTotal: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  logBtn: {
    marginHorizontal: 24,
    backgroundColor: c.accent,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: c.accent,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  logBtnSub: { color: '#e9e3ff', fontSize: 11, marginTop: 2 },
  moodCard: {
    margin: 24,
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardTitle: { fontSize: 13, color: c.textMuted, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    flex: 1,
  },
  moodBtnActive: { backgroundColor: c.cardSoft },
  moodLabel: { fontSize: 11, color: c.textMuted, marginTop: 4 },
  tipCard: {
    marginHorizontal: 24,
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: c.border,
  },
  tipBody: { fontSize: 14, color: c.text, lineHeight: 22 },
});
