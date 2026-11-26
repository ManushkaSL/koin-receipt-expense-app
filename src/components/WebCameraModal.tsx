import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { X, Camera as CameraIcon, RefreshCw } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface WebCameraModalProps {
  visible: boolean;
  onCapture: (imageUri: string) => void;
  onClose: () => void;
}

export const WebCameraModal: React.FC<WebCameraModalProps> = ({
  visible,
  onCapture,
  onClose,
}) => {
  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [visible]);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      setIsReady(false);

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setErrorMsg('Camera access is not supported by this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsReady(true);
      }
    } catch (err: any) {
      console.warn('Web camera error:', err);
      setErrorMsg(
        err?.message || 'Unable to access camera. Please allow camera permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: any) => track.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  };

  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.9);

      stopCamera();
      onCapture(dataUri);
    } catch (err) {
      console.warn('Failed to take photo snapshot:', err);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (Platform.OS !== 'web') return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <CameraIcon size={20} color={colors.primaryGreen} />
              <Text style={styles.title}>Snap Bill / Receipt</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Camera Viewfinder */}
          <View style={styles.viewfinderContainer}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity onPress={startCamera} style={styles.retryBtn}>
                  <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.retryBtnText}>Retry Camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <div style={webVideoWrapperStyle}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={webVideoElementStyle}
                  onLoadedMetadata={() => setIsReady(true)}
                />
                {/* Visual Scanner Alignment Overlay */}
                <div style={scannerBoxStyle} />
              </div>
            )}
          </View>

          {/* Controls Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleTakePhoto}
              disabled={!isReady}
              style={[styles.shutterBtn, !isReady && styles.shutterBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <Text style={styles.shutterHint}>Tap to capture receipt</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Styles for React Native View
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  viewfinderContainer: {
    width: '100%',
    height: 340,
    backgroundColor: '#000000',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 6,
  },
  shutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  shutterBtnDisabled: {
    opacity: 0.4,
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryGreen,
  },
  shutterHint: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

// Inline web styles for pure DOM video in React Native Web
const webVideoWrapperStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  backgroundColor: '#000000',
};

const webVideoElementStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const scannerBoxStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10%',
  left: '10%',
  right: '10%',
  bottom: '10%',
  border: '2px dashed #10B981',
  borderRadius: '16px',
  pointerEvents: 'none',
  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
};
