import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { duasColors as c } from '../../../src/covers/themes/duas';

const ROWS = [
  { date: '09 May', hijri: '21 Dhu al-Qa‘dah', note: '—' },
  { date: '10 May', hijri: '22 Dhu al-Qa‘dah', note: '—' },
  { date: '11 May', hijri: '23 Dhu al-Qa‘dah', note: '—' },
  { date: '12 May', hijri: '24 Dhu al-Qa‘dah', note: '—' },
  { date: '13 May', hijri: '25 Dhu al-Qa‘dah', note: '—' },
  { date: '14 May', hijri: '26 Dhu al-Qa‘dah', note: '—' },
  { date: '15 May', hijri: '27 Dhu al-Qa‘dah', note: '—' },
];

export default function CalendarScreen() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.head}>
        <Text style={styles.title}>हिजरी · Hijri Calendar</Text>
        <Text style={styles.sub}>Upcoming days</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
        {ROWS.map((r) => (
          <View key={r.date} style={styles.row}>
            <Text style={styles.date}>{r.date}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.hijri}>{r.hijri}</Text>
              <Text style={styles.note}>{r.note}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: c.cream },
  sub: { fontSize: 12, color: c.textMuted, marginTop: 4, letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    gap: 14,
  },
  date: { color: c.accent, fontWeight: '800', fontSize: 14, width: 64 },
  hijri: { color: c.cream, fontSize: 14 },
  note: { color: c.textMuted, fontSize: 11, marginTop: 2 },
});
