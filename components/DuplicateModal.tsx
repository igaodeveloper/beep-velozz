import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ScannedPackage } from '@/types/session';
import { formatTimestamp } from '@/utils/session';

interface DuplicateModalProps {
  visible: boolean;
  code: string;
  originalPackage?: ScannedPackage;
  onDismiss: () => void;
}

export default function DuplicateModal({ visible, code, originalPackage, onDismiss }: DuplicateModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(239,68,68,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <View style={{
          backgroundColor: '#0f0a0a',
          borderRadius: 20,
          borderWidth: 2,
          borderColor: '#ef4444',
          padding: 28,
          width: '100%',
          maxWidth: 400,
          alignItems: 'center',
        }}>
          {/* Alert icon */}
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: '#7f1d1d',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 36 }}>🚫</Text>
          </View>

          <Text style={{
            color: '#ef4444', fontSize: 20, fontWeight: '800',
            letterSpacing: 1, marginBottom: 8, textAlign: 'center',
          }}>
            DUPLICATA DETECTADA
          </Text>

          <Text style={{
            color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 20,
          }}>
            Este pacote já foi escaneado anteriormente
          </Text>

          {/* Code display */}
          <View style={{
            backgroundColor: '#1e293b', borderRadius: 10,
            padding: 14, width: '100%', marginBottom: 16,
            borderWidth: 1, borderColor: '#334155',
          }}>
            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>
              CÓDIGO
            </Text>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: 'SpaceMono-Regular' }}>
              {code}
            </Text>
          </View>

          {/* Original scan time */}
          {originalPackage && (
            <View style={{
              backgroundColor: '#1e293b', borderRadius: 10,
              padding: 14, width: '100%', marginBottom: 24,
              borderWidth: 1, borderColor: '#334155',
            }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>
                PRIMEIRO ESCANEAMENTO
              </Text>
              <Text style={{ color: '#f59e0b', fontSize: 16, fontWeight: '700' }}>
                {formatTimestamp(originalPackage.scannedAt)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#ef4444',
              borderRadius: 12,
              padding: 16,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 }}>
              DISPENSAR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
