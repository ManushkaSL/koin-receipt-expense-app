import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, ReceiptText, BarChart2, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationTab, useExpenseStore } from '../store/useExpenseStore';

export const BottomTabBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useExpenseStore();

  const tabs: Array<{ name: NavigationTab; label: string; icon: any }> = [
    { name: 'Home', label: 'Home', icon: Home },
    { name: 'Expenses', label: 'Expenses', icon: ReceiptText },
    { name: 'Insights', label: 'Insights', icon: BarChart2 },
    { name: 'Profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
              onPress={() => setActiveTab(tab.name)}
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
