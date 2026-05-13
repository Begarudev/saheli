import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cycleColors as c } from '../../../src/covers/themes/cycle';

const ROWS = Array.from({ length: 6 }).map((_, i) => ({
  date: `Day ${i * 5 + 1}`,
  note: ['Period', 'Follicular', 'Ovulation', 'Luteal', 'PMS', 'Rest'][i],
}));

export default function CycleCalendar() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.head}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.sub}>Phases at a glance</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 8 }}>
        {ROWS.map((r) => (
          <View key={r.date} style={styles.row}>
            <Text style={styles.date}>{r.date}</Text>
            <Text style={styles.note}>{r.note}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: c.text },
  sub: { fontSize: 12, color: c.textMuted, marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: c.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  date: { color: c.text, fontWeight: '700', fontSize: 14 },
  note: { color: c.accent, fontSize: 14 },
});
