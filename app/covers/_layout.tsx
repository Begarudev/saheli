import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function CoversLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
