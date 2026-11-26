import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Key, Sparkles, X, Check, ExternalLink } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { USER_GEMINI_KEY_STORAGE } from '../services/receiptExtractor';

interface ApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ visible, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (visible) {
      loadKey();
    }
  }, [visible]);

  const loadKey = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_GEMINI_KEY_STORAGE);
      if (stored) {
        setApiKey(stored);
        setHasKey(true);
      } else {
        const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
        setApiKey(envKey);
        setHasKey(!!envKey);
      }
    } catch {}
  };

  const handleSave = async () => {
    try {
      const trimmed = apiKey.trim();
      if (trimmed) {
        await AsyncStorage.setItem(USER_GEMINI_KEY_STORAGE, trimmed);
        setHasKey(true);
        Alert.alert('Saved', 'Gemini Vision AI key saved successfully!');
      } else {
        await AsyncStorage.removeItem(USER_GEMINI_KEY_STORAGE);
        setHasKey(false);
        Alert.alert('Cleared', 'Switched to free zero-config Cloud OCR engine.');
      }
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save API key.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={20} color={colors.primaryGreen} />
              <Text style={styles.title}>AI Scanner Configuration</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Current Engine Badge */}
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: hasKey ? '#10B981' : '#3B82F6' }]} />
            <Text style={styles.statusText}>
              Active Engine:{' '}
              <Text style={{ fontWeight: '700' }}>
                {hasKey ? 'Google Gemini Vision AI' : 'Free Cloud OCR (No key needed)'}
              </Text>
            </Text>
          </View>

          <Text style={styles.desc}>
            Koin extracts receipt data automatically using our free OCR engine. For the highest AI precision, enter a free Google Gemini API key:
          </Text>

          {/* Key Input */}
          <View style={styles.inputContainer}>
            <Key size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Paste Gemini API Key (AIzaSy...)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />
          </View>

          <Text style={styles.hint}>
            💡 Get a 100% free API key instantly at{' '}
            <Text style={{ color: colors.primaryGreen, fontWeight: '700' }}>
              aistudio.google.com/app/apikey
            </Text>
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {hasKey && (
              <TouchableOpacity
                onPress={() => {
                  setApiKey('');
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Reset to Free OCR</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 420,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12.5,
    color: colors.textPrimary,
  },
  desc: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  clearBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
