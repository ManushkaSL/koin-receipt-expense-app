import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Home, ReceiptText, BarChart2, User, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NavigationTab, useExpenseStore } from '../store/useExpenseStore';

export const BottomTabBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useExpenseStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastFade = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showComingSoonToast = (tabName: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setToastMessage(`${tabName} is coming soon in Koin v2`);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastFade.setValue(0);
    Animated.spring(toastFade, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();

    toastTimer.current = setTimeout(() => {
      Animated.timing(toastFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastMessage(null));
    }, 2200);
  };

  const handleTabPress = (tabName: NavigationTab) => {
    if (tabName === 'Expenses') {
      setActiveTab('Expenses');
      return;
    }

    // For other tabs, show the sleek Coming Soon banner and keep Expenses focused
    showComingSoonToast(tabName);
  };

  const tabs: Array<{ name: NavigationTab; label: string; icon: any }> = [
    { name: 'Home', label: 'Home', icon: Home },
    { name: 'Expenses', label: 'Expenses', icon: ReceiptText },
    { name: 'Insights', label: 'Insights', icon: BarChart2 },
    { name: 'Profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {/* Floating Coming Soon Toast Banner */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastBubble,
            {
              opacity: toastFade,
              transform: [
                {
                  translateY: toastFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Sparkles size={14} color="#059669" style={styles.toastIcon} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          const IconComponent = tab.icon;
          const iconColor = isActive ? '#10B981' : '#64748B';
          const textColor = isActive ? '#10B981' : '#64748B';

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.7}
              onPress={() => handleTabPress(tab.name)}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <IconComponent
                size={22}
                color={iconColor}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: textColor,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* iOS Home Indicator Bar */}
      <View style={styles.homeIndicatorWrapper}>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F1EA', // Seamlessly matches Figma warm cream background
    borderTopWidth: 1,
    borderTopColor: '#EBE6DC',
    paddingTop: 10,
    position: 'relative',
  },
  toastBubble: {
    position: 'absolute',
    top: -44,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 999,
  },
  toastIcon: {
    marginRight: 6,
  },
  toastText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 11.5,
    marginTop: 5,
    letterSpacing: -0.1,
  },
  homeIndicatorWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0F172A',
  },
});
