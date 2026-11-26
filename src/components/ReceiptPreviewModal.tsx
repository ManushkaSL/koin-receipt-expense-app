import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Pressable,
  Animated,
} from 'react-native';
import { X, ReceiptText } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface ReceiptPreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  const [modalRendered, setModalRendered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      scaleAnim.setValue(0.88);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 110,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalRendered) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 150,
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
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalRendered(false);
      onClose();
    });
  };

  if (!modalRendered && !visible) {
    return null;
  }

  return (
    <Modal visible={modalRendered || visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ReceiptText size={20} color={colors.primaryGreen} />
              <Text style={styles.title}>Scanned Receipt</Text>
            </View>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            ) : (
              <View style={styles.placeholder}>
                <ReceiptText size={64} color="#94A3B8" />
                <Text style={styles.placeholderText}>Sample Receipt Document</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
