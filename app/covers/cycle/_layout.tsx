import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const CYCLE_COLORS = {
  bg: '#f3f0ff',
  bgDeep: '#ebe6fa',
  accent: '#7c5cff',
  text: '#2a2350',
  muted: '#8780a8',
  border: '#d9d3f0',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 16, color: focused ? CYCLE_COLORS.accent : CYCLE_COLORS.muted, fontWeight: '700' }}>
      {label}
    </Text>
  );
}

export default function CycleLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: CYCLE_COLORS.bgDeep,
          borderTopColor: CYCLE_COLORS.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: CYCLE_COLORS.accent,
        tabBarInactiveTintColor: CYCLE_COLORS.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon label="•" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon label="▦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => <TabIcon label="∿" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ focused }) => <TabIcon label="ⓘ" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
