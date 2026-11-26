import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Coffee,
  ShoppingBasket,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  Tag,
} from 'lucide-react-native';
import { Expense } from '../types/expense';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/currency';
import { getCategoryInfo } from '../utils/categories';

interface ExpenseRowProps {
  expense: Expense;
  isLast?: boolean;
  onPress?: () => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  expense,
  isLast = false,
  onPress,
}) => {
  const categoryInfo = getCategoryInfo(expense.category);

  // Render proper icon for category
  const renderIcon = () => {
    const iconProps = { size: 20, color: categoryInfo.color, strokeWidth: 2 };
    switch (categoryInfo.icon) {
      case 'coffee':
        return <Coffee {...iconProps} />;
      case 'shopping-basket':
        return <ShoppingBasket {...iconProps} />;
      case 'car':
        return <Car {...iconProps} />;
      case 'shopping-bag':
        return <ShoppingBag {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      case 'film':
        return <Film {...iconProps} />;
      case 'heart-pulse':
        return <HeartPulse {...iconProps} />;
      default:
        return <Tag {...iconProps} />;
    }
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.rowContainer}
        accessibilityRole="button"
        accessibilityLabel={`${expense.merchant}, ${expense.date}, ${formatCurrency(expense.total)}`}
      >
        {/* Category Icon Badge */}
        <View style={[styles.iconBadge, { backgroundColor: categoryInfo.bgColor }]}>
          {renderIcon()}
        </View>

        {/* Merchant & Timestamp */}
        <View style={styles.infoCol}>
          <Text style={styles.merchantName} numberOfLines={1}>
            {expense.merchant}
          </Text>
          <Text style={styles.timestamp}>{expense.date}</Text>
        </View>

        {/* Tabular Dollar Amount */}
        <View style={styles.amountCol}>
          <Text style={styles.amountText}>{formatCurrency(expense.total)}</Text>
        </View>
      </TouchableOpacity>

      {!isLast && <View style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  timestamp: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'], // Crucial for tabular alignment per spec
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E1D8', // Warm subtle divider
    marginLeft: 58,
  },
});
