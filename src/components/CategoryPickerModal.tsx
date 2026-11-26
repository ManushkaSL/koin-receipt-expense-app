import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { ExpenseCategory } from '../types/expense';
import { CATEGORIES_LIST, getCategoryInfo } from '../utils/categories';
import { colors } from '../theme/colors';

interface CategoryPickerModalProps {
  visible: boolean;
  selectedCategory: ExpenseCategory;
  onSelect: (category: ExpenseCategory) => void;
  onClose: () => void;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible,
  selectedCategory,
  onSelect,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {CATEGORIES_LIST.map((category) => {
              const info = getCategoryInfo(category);
              const isSelected = selectedCategory === category;

              return (
                <TouchableOpacity
                  key={category}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(category);
                    onClose();
                  }}
                  style={[
                    styles.itemRow,
                    isSelected && styles.itemRowSelected,
                  ]}
                >
                  <View style={[styles.badge, { backgroundColor: info.bgColor }]}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: info.color },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.itemLabel,
                      isSelected && styles.itemLabelSelected,
                    ]}
                  >
                    {category}
                  </Text>
                  {isSelected && (
                    <Check size={18} color={colors.primaryGreen} strokeWidth={2.4} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  itemRowSelected: {
    backgroundColor: colors.primaryGreenLight,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  itemLabelSelected: {
    fontWeight: '700',
    color: colors.emeraldBadgeText,
  },
});
