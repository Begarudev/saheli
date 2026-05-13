import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { duasColors as c } from '../../../src/covers/themes/duas';

export default function About() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>About</Text>
        <Text style={styles.body}>
          Daily Duas is a quiet companion for daily remembrance — today’s dua, a tasbih
          counter for the canonical 33, and prayer-time reminders.
        </Text>
        <Text style={styles.body}>
          दैनिक दुआ — आज की दुआ, तसबीह (33) और नमाज़ के समय का साथी।
        </Text>
        <Text style={styles.small}>v1.0.0 · Daily Duas</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: c.cream, marginBottom: 16 },
  body: { fontSize: 14, color: c.cream, lineHeight: 22, marginBottom: 14 },
  small: { fontSize: 12, color: c.textMuted, marginTop: 12 },
});
