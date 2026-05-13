import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../../src/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, color: focused ? colors.saffron : colors.textMuted }}>{label}</Text>
  );
}

export default function CoverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgDeep,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.saffron,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'मंत्र / Mantras',
          tabBarIcon: ({ focused }) => <TabIcon label="ॐ" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mala"
        options={{
          title: 'माला / Mala',
          tabBarIcon: ({ focused }) => <TabIcon label="॥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'पंचांग / Calendar',
          tabBarIcon: ({ focused }) => <TabIcon label="☀" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ focused }) => <TabIcon label="ℹ" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
