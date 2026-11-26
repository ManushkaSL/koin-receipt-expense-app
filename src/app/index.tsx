import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Plus, Sparkles } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { useExpenseStore } from '../store/useExpenseStore';
import { extractReceiptData } from '../services/receiptExtractor';
import { DashedBorderCard } from '../components/DashedBorderCard';
import { ExpenseRow } from '../components/ExpenseRow';
import { BottomTabBar } from '../components/BottomTabBar';
import { ScanningModal } from '../components/ScanningModal';
import { WebCameraModal } from '../components/WebCameraModal';
import { ApiKeyModal } from '../components/ApiKeyModal';

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    expenses,
    isScanning,
    scanProgress,
    scanStage,
    setScanning,
    setCurrentReview,
  } = useExpenseStore();

  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [webCameraVisible, setWebCameraVisible] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  // Common handler to start extraction pipeline
  const processReceiptImage = async (imageUri: string, base64?: string | null) => {
    setScannedImageUri(imageUri);
    setScanning(true, 0.15, 'Enhancing receipt image...');

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      const extractedData = await extractReceiptData(imageUri, base64, (update) => {
        setScanning(true, update.progress, update.stage);
      });

      setCurrentReview(extractedData);
      setScanning(false, 1, 'Done');

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      // Transition smoothly to Review Extracted Receipt screen
      router.push('/review');
    } catch (error) {
      setScanning(false);
      Alert.alert(
        'Scan Error',
        'Unable to parse receipt. Please try another image or enter manually.'
      );
    }
  };

  const handleCameraCapture = async () => {
    // If running on web browser, open real interactive webcam viewfinder modal
    if (Platform.OS === 'web') {
      setWebCameraVisible(true);
      return;
    }

    // On native iOS / Android, launch the device camera directly
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission',
          'Camera access is required to snap receipt bills.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
        cameraType: ImagePicker.CameraType.back,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processReceiptImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (err) {
      console.warn('Native camera error:', err);
      Alert.alert(
        'Camera Error',
        'Could not start camera on this device. Please use gallery upload.'
      );
    }
  };

  const handleGalleryPick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Permission',
          'Gallery access is required to select receipt photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processReceiptImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    }
  };

  const handleScanBillPress = () => {
    Alert.alert(
      'Scan Bill',
      'Choose how you want to upload your receipt:',
      [
        { text: 'Take Photo', onPress: handleCameraCapture },
        { text: 'Choose from Gallery', onPress: handleGalleryPick },
        { text: 'AI Settings', onPress: () => setApiKeyModalVisible(true) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>KOIN</Text>
            <TouchableOpacity
              onPress={() => setApiKeyModalVisible(true)}
              style={styles.aiBadge}
              accessibilityLabel="AI Scanner Settings"
            >
              <Sparkles size={11} color="#059669" />
              <Text style={styles.aiBadgeText}>AI Engine</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Expenses</Text>
        </View>

        {/* Emerald "+ Scan Bill" Pill Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleScanBillPress}
          style={styles.scanBillButton}
          accessibilityRole="button"
          accessibilityLabel="Scan Bill"
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={3} style={styles.plusIcon} />
          <Text style={styles.scanBillText}>Scan Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashed Border Upload Card */}
        <DashedBorderCard
          onCameraPress={handleCameraCapture}
          onGalleryPress={handleGalleryPick}
        />

        {/* Recent Activity Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSubtitle}>This week</Text>
        </View>

        {/* Transaction Rows directly on warm cream background */}
        <View style={styles.recentActivityList}>
          {expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses recorded yet.</Text>
              <Text style={styles.emptySubtext}>
                Tap Camera or Gallery to scan your first receipt bill!
              </Text>
            </View>
          ) : (
            expenses.map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                isLast={index === expenses.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Tab Bar */}
      <BottomTabBar />

      {/* Scanning Laser Animation Modal */}
      <ScanningModal
        visible={isScanning}
        imageUri={scannedImageUri}
        stage={scanStage}
        progress={scanProgress}
      />

      {/* Live Web Camera Viewfinder Modal (Web Browser) */}
      <WebCameraModal
        visible={webCameraVisible}
        onCapture={(dataUri) => {
          setWebCameraVisible(false);
          processReceiptImage(dataUri);
        }}
        onClose={() => setWebCameraVisible(false)}
      />

      {/* AI Key / Configuration Modal */}
      <ApiKeyModal
        visible={apiKeyModalVisible}
        onClose={() => setApiKeyModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  titleColumn: {
    justifyContent: 'flex-end',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  scanBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B37E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  plusIcon: {
    marginRight: 4,
  },
  scanBillText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '500',
  },
  recentActivityList: {
    width: '100%',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
