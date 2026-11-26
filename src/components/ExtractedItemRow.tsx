import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { ReceiptItem } from '../types/expense';
import { colors } from '../theme/colors';
import { sanitizePriceInput, formatAmountNumber } from '../utils/currency';

interface ExtractedItemRowProps {
  item: ReceiptItem;
  onNameChange: (name: string) => void;
  onPriceChange: (price: number) => void;
  onDelete: () => void;
  isLast?: boolean;
}

export const ExtractedItemRow: React.FC<ExtractedItemRowProps> = ({
  item,
  onNameChange,
  onPriceChange,
  onDelete,
  isLast = false,
}) => {
  // Keep local string state for smooth fluid typing in price input box
  const [priceStr, setPriceStr] = useState(
    item.price > 0 ? formatAmountNumber(item.price) : ''
  );

  useEffect(() => {
    // Synchronize price string when external item changes (e.g. initial load)
    const currentNum = parseFloat(priceStr) || 0;
    if (Math.abs(currentNum - item.price) > 0.001) {
      setPriceStr(item.price > 0 ? formatAmountNumber(item.price) : '');
    }
  }, [item.price]);

  const handlePriceTextChange = (text: string) => {
    const cleaned = sanitizePriceInput(text);
    setPriceStr(cleaned);
    const num = parseFloat(cleaned) || 0;
    onPriceChange(num);
  };

  const handlePriceBlur = () => {
    const num = parseFloat(priceStr) || 0;
    if (num > 0) {
      setPriceStr(formatAmountNumber(num));
    } else {
      setPriceStr('0.00');
      onPriceChange(0);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* Item Name Input */}
        <TextInput
          style={styles.nameInput}
          value={item.name}
          onChangeText={onNameChange}
          placeholder="Item name"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          accessibilityLabel="Item description"
        />

        {/* Currency Input Box */}
        <View style={styles.priceBox}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.priceInput}
            value={priceStr}
            onChangeText={handlePriceTextChange}
            onBlur={handlePriceBlur}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            accessibilityLabel="Item price"
          />
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel={`Delete item ${item.name}`}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color="#94A3B8" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {!isLast && <View style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 4,
    marginRight: 10,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    width: 96,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  dollarSign: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  deleteButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EAE6DF',
  },
});
