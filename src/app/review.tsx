import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Pencil,
  Calendar,
  ChevronDown,
  Plus,
  Check,
  ReceiptText,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { useExpenseStore } from '../store/useExpenseStore';
import { formatCurrency } from '../utils/currency';
import { ExtractedItemRow } from '../components/ExtractedItemRow';
import { CategoryPickerModal } from '../components/CategoryPickerModal';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal';

export default function ReviewReceiptScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    currentReview,
    updateReviewMerchant,
    updateReviewDate,
    updateReviewCategory,
    updateReviewItemName,
    updateReviewItemPrice,
    addReviewItem,
    removeReviewItem,
    saveCurrentExpense,
  } = useExpenseStore();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const totalScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentReview?.total !== undefined) {
      Animated.sequence([
        Animated.timing(totalScaleAnim, {
          toValue: 1.07,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(totalScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentReview?.total]);

  // If no review data exists (e.g. direct deep-link or refresh), provide fallback or back button
  if (!currentReview) {
    return (
      <View style={[styles.container, styles.emptyCenter, { paddingTop: insets.top }]}>
        <ReceiptText size={48} color={colors.textSecondary} />
        <Text style={styles.noDataTitle}>No active receipt to review</Text>
        <Text style={styles.noDataSubtitle}>
          Please upload or snap a bill from the Expenses screen.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHomeBtn}
        >
          <Text style={styles.backHomeBtnText}>Go to Expenses</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirmAndSave = async () => {
    // 1. Validation checks per prompt specifications:
    // "Tapping 'Confirm & Save' validates the inputs (e.g., prevents saving empty
    // merchant names or invalid/negative totals) and appends the finalized
    // expense to the main Recent Expenses list with immediate UI feedback."

    if (!currentReview.merchant.trim()) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert('Validation Error', 'Please enter a valid Merchant Name.');
      return;
    }

    if (currentReview.items.length === 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert('Validation Error', 'Receipt must contain at least one line item.');
      return;
    }

    if (currentReview.total <= 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert(
        'Invalid Total',
        'Total amount must be greater than $0.00. Please enter item prices.'
      );
      return;
    }

    setIsSaving(true);
    try {
      await saveCurrentExpense();
      router.replace('/');
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    }
  };

  const itemCountText = `${currentReview.items.length} ${
    currentReview.items.length === 1 ? 'item' : 'items'
  }`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Back to Expenses"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Review Receipt</Text>

        {/* Thumbnail preview button on top right */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPreviewModalVisible(true)}
          style={styles.thumbnailBtn}
          accessibilityLabel="Preview original receipt image"
          accessibilityRole="button"
        >
          {currentReview.receiptUri ? (
            <Image
              source={{ uri: currentReview.receiptUri }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <ReceiptText size={18} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* White Summary Card */}
        <View style={styles.summaryCard}>
          {/* Merchant Name Row */}
          <View style={styles.merchantSection}>
            <Text style={styles.fieldLabel}>Merchant Name</Text>
            <View style={styles.merchantInputRow}>
              <TextInput
                style={styles.merchantInput}
                value={currentReview.merchant}
                onChangeText={updateReviewMerchant}
                placeholder="Merchant Name"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                accessibilityLabel="Merchant Name"
              />
              <Pencil size={18} color={colors.textSecondary} strokeWidth={2} />
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Date & Category Row */}
          <View style={styles.metaRow}>
            {/* Date Field */}
            <View style={styles.metaCol}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={styles.dateInput}
                  value={currentReview.date}
                  onChangeText={updateReviewDate}
                  placeholder="Date"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Receipt Date"
                />
                <Calendar size={16} color={colors.textSecondary} strokeWidth={2} />
              </View>
            </View>

            {/* Category Dropdown Pill */}
            <View style={styles.metaCol}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCategoryModalVisible(true)}
                style={styles.categoryPill}
                accessibilityRole="button"
                accessibilityLabel={`Category: ${currentReview.category}. Tap to change.`}
              >
                <Text style={styles.categoryPillText} numberOfLines={1}>
                  {currentReview.category}
                </Text>
                <ChevronDown size={14} color={colors.emeraldBadgeText} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Extracted Items Section */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeaderRow}>
            <Text style={styles.itemsTitle}>Extracted Items</Text>
            <Text style={styles.itemsCountBadge}>{itemCountText}</Text>
          </View>

          {/* Extracted Items White Container */}
          <View style={styles.itemsContainer}>
            {currentReview.items.map((item, index) => (
              <ExtractedItemRow
                key={item.id}
                item={item}
                onNameChange={(name) => updateReviewItemName(item.id, name)}
                onPriceChange={(price) => updateReviewItemPrice(item.id, price)}
                onDelete={() => removeReviewItem(item.id)}
                isLast={index === currentReview.items.length - 1}
              />
            ))}

            {/* "+ Add Item" Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={addReviewItem}
              style={styles.addItemBtn}
              accessibilityRole="button"
              accessibilityLabel="Add new line item"
            >
              <Plus size={18} color={colors.primaryGreen} strokeWidth={2.5} style={styles.addIcon} />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Subtle Helper Note */}
          <View style={styles.helperRow}>
            <Check size={14} color={colors.textSecondary} strokeWidth={2.2} style={styles.helperIcon} />
            <Text style={styles.helperText}>
              All set? Give your items a quick check.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Summary Bar */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Animated.View style={{ transform: [{ scale: totalScaleAnim }], alignSelf: 'flex-start' }}>
              <Text style={styles.totalAmountText}>
                {formatCurrency(currentReview.total)}
              </Text>
            </Animated.View>
          </View>

          {/* Item count badge */}
          <View style={styles.itemCountBadgePill}>
            <Check size={14} color={colors.primaryGreen} strokeWidth={2.8} />
            <Text style={styles.itemCountBadgePillText}>
              {itemCountText}
            </Text>
          </View>
        </View>

        {/* Full-width Confirm & Save Expense Primary Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConfirmAndSave}
          disabled={isSaving}
          style={styles.confirmButton}
          accessibilityRole="button"
          accessibilityLabel="Confirm & Save Expense"
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2.8} style={styles.confirmIcon} />
          <Text style={styles.confirmButtonText}>
            {isSaving ? 'Saving...' : 'Confirm & Save Expense'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CategoryPickerModal
        visible={categoryModalVisible}
        selectedCategory={currentReview.category}
        onSelect={updateReviewCategory}
        onClose={() => setCategoryModalVisible(false)}
      />

      <ReceiptPreviewModal
        visible={previewModalVisible}
        imageUri={currentReview.receiptUri || null}
        onClose={() => setPreviewModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backHomeBtn: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backButton: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  thumbnailBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    marginHorizontal: 18,
    marginTop: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  merchantSection: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  merchantInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  merchantInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 2,
    marginRight: 8,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaCol: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 6,
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  categoryPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.emeraldBadgeText,
  },
  itemsSection: {
    marginHorizontal: 18,
    marginTop: 24,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  itemsCountBadge: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  itemsContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addIcon: {
    marginRight: 8,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryGreen,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 6,
    gap: 6,
  },
  helperIcon: {
    marginTop: 1,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  stickyBottomBar: {
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#EAE6DF',
    paddingHorizontal: 20,
    paddingTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalAmountText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  itemCountBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 6,
  },
  itemCountBadgePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryGreen,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B37E',
    borderRadius: 16,
    height: 54,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  confirmIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
