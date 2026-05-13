import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cycleColors as c } from '../../../src/covers/themes/cycle';

const TIPS = [
  { title: 'Hydration', body: 'Aim for steady water intake through the day.' },
  { title: 'Sleep', body: 'Consistent sleep helps cycle regularity.' },
  { title: 'Movement', body: 'Light movement can ease cramps for many people.' },
  { title: 'Notice patterns', body: 'Logs over a few months reveal your unique rhythm.' },
];

export default function Insights() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.head}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.sub}>Gentle, generic guidance</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        {TIPS.map((t) => (
          <View key={t.title} style={styles.card}>
            <Text style={styles.cardTitle}>{t.title}</Text>
            <Text style={styles.cardBody}>{t.body}</Text>
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
  card: {
    backgroundColor: c.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: 4 },
  cardBody: { fontSize: 13, color: c.textMuted, lineHeight: 20 },
});
