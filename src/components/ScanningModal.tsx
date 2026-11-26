import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Sparkles, ScanLine } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface ScanningModalProps {
  visible: boolean;
  imageUri: string | null;
  stage: string;
  progress: number;
}

export const ScanningModal: React.FC<ScanningModalProps> = ({
  visible,
  imageUri,
  stage,
  progress,
}) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Loop scan line animation up and down
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );

      // Subtle pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );

      scanLoop.start();
      pulseLoop.start();

      return () => {
        scanLoop.stop();
        pulseLoop.stop();
      };
    }
  }, [visible]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.contentCard}>
          {/* Receipt Image Preview Container */}
          <View style={styles.imageWrapper}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.receiptImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderImage}>
                <ScanLine size={48} color={colors.primaryGreen} strokeWidth={1.5} />
              </View>
            )}

            {/* Glowing Scan Line Animation */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY }],
                },
              ]}
            />
          </View>

          {/* Status Message */}
          <View style={styles.statusRow}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Sparkles size={20} color={colors.primaryGreen} />
            </Animated.View>
            <Text style={styles.stageTitle}>AI Vision Extraction</Text>
          </View>

          <Text style={styles.stageSubtitle}>{stage || 'Analyzing receipt data...'}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(10, progress * 100))}%` },
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  imageWrapper: {
    width: 200,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primaryGreen,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    textAlign: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryGreen,
    borderRadius: 3,
  },
});
