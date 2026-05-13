import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../src/theme';

export default function AboutScreen() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={typography.h1}>About · परिचय</Text>
        <Image
          source={require('../../../assets/diwali_folk.jpg')}
          style={styles.img}
          resizeMode="cover"
        />
        <Text style={styles.body}>
          Daily Mantras lays bare the spiritual bandwidth of every Hindu home. From the depths of the
          Vedas to the joy of festivals, we bring you a calm corner for daily sadhana.
        </Text>
        <Text style={styles.body}>
          वैदिक मंत्र, जप माला और पंचांग — आपकी दिनचर्या का दिव्य साथी।
        </Text>
        <Text style={styles.small}>v1.0.0 · Daily Mantras Trust</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', height: 180, borderRadius: radius.lg, marginVertical: spacing.lg },
  body: { ...typography.body, marginBottom: spacing.md, lineHeight: 22 },
  small: { ...typography.small, marginTop: spacing.lg },
});
