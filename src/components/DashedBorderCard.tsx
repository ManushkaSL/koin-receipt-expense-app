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
      {/* Centered Mint Icon Badge */}
      <View style={styles.iconBadge}>
        <ReceiptText size={24} color="#10B981" strokeWidth={2.2} />
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
          <Camera size={19} color="#0F172A" strokeWidth={2} style={styles.btnIcon} />
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onGalleryPress}
          style={styles.actionButton}
          accessibilityLabel="Choose receipt from gallery"
          accessibilityRole="button"
        >
          <ImageIcon size={19} color="#0F172A" strokeWidth={2} style={styles.btnIcon} />
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#86EFAC', // Exact mint green dashed outline from Figma
    borderStyle: 'dashed',
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 28,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#DCFCE7', // Soft mint rounded square
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 22,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
});
