import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

interface ScanActionSheetProps {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
}

export const ScanActionSheet: React.FC<ScanActionSheetProps> = ({
  visible,
  onCamera,
  onGallery,
  onClose,
}) => {
  const [modalRendered, setModalRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      slideAnim.setValue(320);
      fadeAnim.setValue(0);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      // Animate out before closing modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 320,
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
        toValue: 320,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalRendered(false);
      onClose();
    });
  };

  const handleSelect = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 320,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalRendered(false);
      onClose();
      callback();
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
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Top Drag Indicator */}
        <View style={styles.handleIndicator} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scan Receipt</Text>
            <Text style={styles.subtitle}>Choose how to import your bill</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDismiss}
            style={styles.closeBtn}
            accessibilityLabel="Close"
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
          {/* Camera Option */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelect(onCamera)}
            style={styles.optionCard}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#DCFCE7' }]}>
              <Camera size={22} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.optionTextCol}>
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionDesc}>Capture physical bill with camera</Text>
            </View>
          </TouchableOpacity>

          {/* Gallery Option */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelect(onGallery)}
            style={styles.optionCard}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#EDE9FE' }]}>
              <ImageIcon size={22} color="#7C3AED" strokeWidth={2.2} />
            </View>
            <View style={styles.optionTextCol}>
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionDesc}>Upload receipt image from device</Text>
            </View>
          </TouchableOpacity>
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
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
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
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '400',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFEBE4',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  optionDesc: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
});
