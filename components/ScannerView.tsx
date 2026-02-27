import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { ScannedPackage } from '@/types/session';
import { classifyPackage, packageTypeLabel, packageTypeBadgeColors, generateId } from '@/utils/session';

interface ScannerViewProps {
  onScan: (pkg: ScannedPackage) => void;
  onDuplicate: (code: string) => void;
  packages: ScannedPackage[];
  lastScanned?: ScannedPackage | null;
  onEndSession: () => void;
}

export default function ScannerView({
  onScan,
  onDuplicate,
  packages,
  lastScanned,
  onEndSession,
}: ScannerViewProps) {
  const [manualCode, setManualCode] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for reticle
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Feedback flash when scanned
  useEffect(() => {
    if (lastScanned) {
      setShowFeedback(true);
      Animated.sequence([
        Animated.timing(feedbackAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => setShowFeedback(false));
    }
  }, [lastScanned]);

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;

    const duplicate = packages.find(p => p.code === code);
    if (duplicate) {
      onDuplicate(code);
      setManualCode('');
      return;
    }

    const type = classifyPackage(code);
    const pkg: ScannedPackage = {
      id: generateId(),
      code,
      type,
      scannedAt: new Date().toISOString(),
    };
    onScan(pkg);
    setManualCode('');
  };

  const lastBadge = lastScanned ? packageTypeBadgeColors(lastScanned.type) : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#080d18', position: 'relative' }}>
      {/* Camera area (mock/placeholder for web compat) */}
      <View style={{
        flex: 1,
        backgroundColor: '#0a0f1e',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Grid lines overlay */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.04,
        }}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={{
              position: 'absolute',
              left: 0, right: 0,
              top: `${(i + 1) * 12}%` as any,
              height: 1,
              backgroundColor: '#10b981',
            }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <View key={i} style={{
              position: 'absolute',
              top: 0, bottom: 0,
              left: `${(i + 1) * 16}%` as any,
              width: 1,
              backgroundColor: '#10b981',
            }} />
          ))}
        </View>

        {/* Scanner Reticle */}
        <Animated.View style={{
          width: 220,
          height: 140,
          transform: [{ scale: pulseAnim }],
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Corner brackets */}
          {[
            { top: 0, left: 0 },
            { top: 0, right: 0 },
            { bottom: 0, left: 0 },
            { bottom: 0, right: 0 },
          ].map((pos, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 24, height: 24,
                ...pos,
                borderColor: '#10b981',
                borderTopWidth: i < 2 ? 3 : 0,
                borderBottomWidth: i >= 2 ? 3 : 0,
                borderLeftWidth: i === 0 || i === 2 ? 3 : 0,
                borderRightWidth: i === 1 || i === 3 ? 3 : 0,
              }}
            />
          ))}

          {/* Scan line */}
          <View style={{
            position: 'absolute',
            left: 8, right: 8, height: 2,
            backgroundColor: '#10b981',
            opacity: 0.7,
          }} />

          {/* Center dot */}
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#10b981', opacity: 0.8,
          }} />
        </Animated.View>

        <Text style={{
          color: '#334155', fontSize: 12, marginTop: 20,
          fontWeight: '500', letterSpacing: 0.5,
        }}>
          Posicione o código de barras
        </Text>

        {/* Status: camera not available on web, show manual entry hint */}
        <View style={{
          marginTop: 12,
          backgroundColor: '#1e293b',
          borderRadius: 8,
          paddingHorizontal: 12, paddingVertical: 6,
        }}>
          <Text style={{ color: '#475569', fontSize: 11, fontWeight: '600' }}>
            📱 Use a entrada manual abaixo
          </Text>
        </View>

        {/* Last scanned feedback overlay */}
        {showFeedback && lastScanned && lastBadge && (
          <Animated.View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(16,185,129,0.08)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: feedbackAnim,
          }}>
            <View style={{
              backgroundColor: '#052e16',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#10b981',
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>✅</Text>
              <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '700', marginTop: 4 }}>
                ESCANEADO
              </Text>
              <View style={{
                backgroundColor: lastBadge.bg, borderRadius: 6,
                paddingHorizontal: 10, paddingVertical: 4, marginTop: 6,
              }}>
                <Text style={{ color: lastBadge.text, fontSize: 11, fontWeight: '700' }}>
                  {packageTypeLabel(lastScanned.type)}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Manual Input Bar */}
      <View style={{
        backgroundColor: '#0f172a',
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        padding: 16,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
      }}>
        <TextInput
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="Inserir código manualmente..."
          placeholderTextColor="#334155"
          returnKeyType="done"
          onSubmitEditing={handleManualSubmit}
          autoCapitalize="characters"
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            borderWidth: 1,
            borderColor: '#334155',
            borderRadius: 10,
            padding: 12,
            color: '#fff',
            fontSize: 15,
            fontFamily: 'SpaceMono-Regular',
          }}
        />
        <TouchableOpacity
          onPress={handleManualSubmit}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#10b981',
            borderRadius: 10,
            padding: 13,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* End Session Button */}
      <View style={{
        backgroundColor: '#0f172a',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 4,
      }}>
        <TouchableOpacity
          onPress={onEndSession}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 10,
            padding: 13,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#334155',
          }}
        >
          <Text style={{ color: '#f59e0b', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
            ⏹ ENCERRAR SESSÃO
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
