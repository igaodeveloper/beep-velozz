import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/utils/useAppTheme';

interface PackagePhotoCaptureProps {
  maxPhotos?: number;
  onPhotoCapture: (photoUri: string) => void;
  onClose: () => void;
  packageCode: string;
  visible: boolean;
}

export default function PackagePhotoCapture({
  onPhotoCapture,
  onClose,
  packageCode,
  visible,
  maxPhotos = 3,
}: PackagePhotoCaptureProps) {
  const { colors } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enableFlash, setEnableFlash] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');

  useEffect(() => {
    if (visible && permission?.status !== 'granted') {
      requestPermission();
    }
  }, [visible]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      setCapturedPhoto(photo.uri);
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPhoto = async () => {
    if (!capturedPhoto) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPhotoCapture(capturedPhoto);
      setCapturedPhoto(null);
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar foto:', error);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  if (!permission) {
    return null;
  }

  if (permission.status !== 'granted') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' }}>
            Permissão de Câmera
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Precisamos de acesso à câmera para capturar fotos dos pacotes.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 24,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
              Permitir Acesso
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      {capturedPhoto ? (
        // Preview da foto capturada
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.surface2,
            }}
          >
            <View>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
                FOTO CAPTURADA
              </Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                {packageCode}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24 }}>
            <Image
              source={{ uri: capturedPhoto }}
              style={{
                width: '100%',
                height: 400,
                borderRadius: 14,
                backgroundColor: colors.surface2,
              }}
              resizeMode="cover"
            />
          </View>

          {/* Actions */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderTopColor: colors.surface2,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={confirmPhoto}
              style={{
                backgroundColor: colors.success,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                ✓ Confirmar Foto
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={retakePhoto}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                🔄 Tirar Outra Foto
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Camera View
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={cameraFacing}
            flash={enableFlash ? 'on' : 'off'}
          >
            {/* Top Controls */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18 }}>✕</Text>
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
                  CÂMERA
                </Text>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                  {packageCode}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setEnableFlash(!enableFlash)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18 }}>{enableFlash ? '💡' : '⚡'}</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 24,
              }}
            >
              {/* Flip Camera Button */}
              <TouchableOpacity
                onPress={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>🔄</Text>
              </TouchableOpacity>

              {/* Capture Button */}
              <TouchableOpacity
                onPress={takePicture}
                disabled={isProcessing}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isProcessing ? 0.6 : 1,
                  borderWidth: 3,
                  borderColor: '#fff',
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: 28 }}>📷</Text>
                )}
              </TouchableOpacity>

              {/* Spacer */}
              <View style={{ width: 50 }} />
            </View>

            {/* Center Guide */}
            <View
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 280,
                height: 280,
                marginLeft: -140,
                marginTop: -140,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 20,
                backgroundColor: 'transparent',
              }}
            />
            <Text
              style={{
                position: 'absolute',
                top: '30%',
                left: 0,
                right: 0,
                textAlign: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              Enquadre o pacote dentro da área
            </Text>
          </CameraView>
        </View>
      )}
    </Modal>
  );
}
