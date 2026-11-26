import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useExpenseStore } from '../store/useExpenseStore';

export default function RootLayout() {
  const loadExpenses = useExpenseStore((state) => state.loadExpenses);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F4F1EA' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="review" />
      </Stack>
    </SafeAreaProvider>
  );
}
