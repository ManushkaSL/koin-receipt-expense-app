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
import { ScanLine, ReceiptText } from 'lucide-react-native';
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
  const cardScaleAnim = useRef(new Animated.Value(0.9)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values explicitly so animation replays fresh every time
      scanLineAnim.setValue(0);
      pulseAnim.setValue(1);
      cardScaleAnim.setValue(0.9);
      cardOpacityAnim.setValue(0);

      // Entrance animation
      Animated.parallel([
        Animated.timing(cardOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Loop scan line animation smoothly across the receipt
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );

      // Subtle pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
        ])
      );

      scanLoop.start();
      pulseLoop.start();

      return () => {
        scanLoop.stop();
        pulseLoop.stop();
        scanLineAnim.setValue(0);
        pulseAnim.setValue(1);
      };
    }
  }, [visible]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 190],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.contentCard,
            {
              opacity: cardOpacityAnim,
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          {/* Receipt Image Viewfinder Container */}
          <View style={styles.imageWrapper}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.receiptImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderImage}>
                <ScanLine size={52} color={colors.primaryGreen} strokeWidth={1.6} />
              </View>
            )}

            {/* Glowing Emerald Laser Line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY }],
                },
              ]}
            />

            {/* Scanner Corner Brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {/* Status Message */}
          <View style={styles.statusRow}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <ReceiptText size={22} color={colors.primaryGreen} strokeWidth={2.4} />
            </Animated.View>
            <Text style={styles.stageTitle}>Extracting...</Text>
          </View>

          <Text style={styles.stageSubtitle}>{stage || 'Reading receipt details...'}</Text>

          {/* Clean Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(12, progress * 100))}%` },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
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
        shadowOpacity: 0.16,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  imageWrapper: {
    width: 210,
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
    marginBottom: 20,
    borderWidth: 1.5,
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
    height: 3.5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#10B981',
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  stageSubtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginBottom: 20,
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
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
});
