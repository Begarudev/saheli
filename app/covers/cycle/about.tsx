import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cycleColors as c } from '../../../src/covers/themes/cycle';

export default function About() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>About</Text>
        <Text style={styles.body}>
          Cycle & Wellness is a simple, religion-neutral period and wellness tracker. Track your
          cycle, notice patterns, stay informed.
        </Text>
        <Text style={styles.small}>v1.0.0 · Wellness</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: c.text, marginBottom: 16 },
  body: { fontSize: 14, color: c.text, lineHeight: 22, marginBottom: 16 },
  small: { fontSize: 12, color: c.textMuted },
});
