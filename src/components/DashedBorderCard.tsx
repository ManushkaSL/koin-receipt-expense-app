import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Camera, Image as ImageIcon, ReceiptText } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface DashedBorderCardProps {
  onCameraPress: () => void;
  onGalleryPress: () => void;
}

export const DashedBorderCard: React.FC<DashedBorderCardProps> = ({
  onCameraPress,
  onGalleryPress,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Icon Badge */}
      <View style={styles.iconBadge}>
        <ReceiptText size={22} color={colors.primaryGreen} strokeWidth={2.2} />
      </View>

      {/* Headings */}
      <Text style={styles.title}>Upload or Snap a Bill</Text>
      <Text style={styles.subtitle}>Less typing. More living.</Text>

      {/* Action Buttons Row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCameraPress}
          style={styles.actionButton}
          accessibilityLabel="Open camera to scan bill"
          accessibilityRole="button"
        >
          <Camera size={18} color={colors.textPrimary} strokeWidth={2} style={styles.btnIcon} />
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onGalleryPress}
          style={styles.actionButton}
          accessibilityLabel="Choose receipt from gallery"
          accessibilityRole="button"
        >
          <ImageIcon size={18} color={colors.textPrimary} strokeWidth={2} style={styles.btnIcon} />
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#A7F3D0', // Mint dashed border matching Figma
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 26,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E6F7F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginBottom: 20,
    fontWeight: '400',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  btnIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
