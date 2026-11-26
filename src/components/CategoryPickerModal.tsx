import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  const [modalRendered, setModalRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(340)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      slideAnim.setValue(340);
      fadeAnim.setValue(0);

      try {
        Haptics.selectionAsync();
      } catch {}

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalRendered) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 340,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalRendered(false);
      });
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 340,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalRendered(false);
      onClose();
    });
  };

  const handleChoose = (category: ExpenseCategory) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 340,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalRendered(false);
      onSelect(category);
      onClose();
    });
  };

  if (!modalRendered && !visible) {
    return null;
  }

  return (
    <Modal visible={modalRendered || visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Pressable style={styles.backdropPressable} onPress={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </Pressable>

      <Animated.View
        style={[
          styles.modalContent,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handleIndicator} />

        <View style={styles.header}>
          <Text style={styles.title}>Select Category</Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
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
                onPress={() => handleChoose(category)}
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
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleIndicator: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
  },
  itemRowSelected: {
    backgroundColor: '#DCFCE7',
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
    color: '#0F172A',
  },
  itemLabelSelected: {
    fontWeight: '700',
    color: '#065F46',
  },
});
