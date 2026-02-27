import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { theme } from '@/utils/theme';

interface SessionInitModalProps {
  visible: boolean;
  onStart: (operatorName: string, driverName: string, declaredCounts: { shopee: number; mercadoLivre: number; avulso: number }) => void;
}

export default function SessionInitModal({ visible, onStart }: SessionInitModalProps) {
  const [operatorName, setOperatorName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [shopeeCount, setShopeeCount] = useState('');
  const [mercadoLivreCount, setMercadoLivreCount] = useState('');
  const [avulsoCount, setAvulsoCount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!operatorName.trim()) newErrors.operatorName = 'Campo obrigatório';
    if (!driverName.trim()) newErrors.driverName = 'Campo obrigatório';
    
    const shopee = Number(shopeeCount) || 0;
    const mercadoLivre = Number(mercadoLivreCount) || 0;
    const avulso = Number(avulsoCount) || 0;
    const total = shopee + mercadoLivre + avulso;
    
    if (total < 1) {
      newErrors.total = 'Informe pelo menos um pacote';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = () => {
    if (!validate()) return;
    const declaredCounts = {
      shopee: Number(shopeeCount) || 0,
      mercadoLivre: Number(mercadoLivreCount) || 0,
      avulso: Number(avulsoCount) || 0,
    };
    onStart(operatorName.trim(), driverName.trim(), declaredCounts);
    setOperatorName('');
    setDriverName('');
    setShopeeCount('');
    setMercadoLivreCount('');
    setAvulsoCount('');
    setErrors({});
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', paddingHorizontal: 20 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 20 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 16,
                backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <Text style={{ fontSize: 30 }}>📦</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 1 }}>
                NOVA SESSÃO
              </Text>
              <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Preencha os dados antes de iniciar
              </Text>
            </View>

            {/* Form Card */}
            <Animated.View
              entering={FadeInDown.duration(320)}
              exiting={FadeOutDown.duration(220)}
              style={{
                backgroundColor: '#0f172a', borderRadius: 16,
                borderWidth: 1, borderColor: '#1e293b', padding: 24,
              }}
            >
              {/* Operator Name */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
                  Operador
                </Text>
                <TextInput
                  value={operatorName}
                  onChangeText={setOperatorName}
                  placeholder="Nome do operador"
                  placeholderTextColor="#334155"
                  style={{
                    backgroundColor: '#1e293b',
                    borderWidth: 1,
                    borderColor: errors.operatorName ? '#ef4444' : '#334155',
                    borderRadius: 10,
                    padding: 14,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                />
                {errors.operatorName && (
                  <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.operatorName}</Text>
                )}
              </View>

              {/* Driver Name */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
                  Motorista
                </Text>
                <TextInput
                  value={driverName}
                  onChangeText={setDriverName}
                  placeholder="Nome do motorista"
                  placeholderTextColor="#334155"
                  style={{
                    backgroundColor: '#1e293b',
                    borderWidth: 1,
                    borderColor: errors.driverName ? '#ef4444' : '#334155',
                    borderRadius: 10,
                    padding: 14,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                />
                {errors.driverName && (
                  <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.driverName}</Text>
                )}
              </View>

              {/* Declared Counts */}
              <View style={{ marginBottom: 28 }}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>
                  Qtd. Declarada por Tipo
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  {/* Shopee */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fb923c', fontSize: 10, fontWeight: '600', marginBottom: 6, textAlign: 'center' }}>
                      � SHOPEE
                    </Text>
                    <TextInput
                      value={shopeeCount}
                      onChangeText={setShopeeCount}
                      placeholder="0"
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      style={{
                        backgroundColor: '#1e293b',
                        borderWidth: 1,
                        borderColor: errors.shopee ? '#ef4444' : '#334155',
                        borderRadius: 10,
                        padding: 12,
                        color: '#fff',
                        fontSize: 20,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  
                  {/* Mercado Livre */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '600', marginBottom: 6, textAlign: 'center' }}>
                      🟨 MERCADO LIVRE
                    </Text>
                    <TextInput
                      value={mercadoLivreCount}
                      onChangeText={setMercadoLivreCount}
                      placeholder="0"
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      style={{
                        backgroundColor: '#1e293b',
                        borderWidth: 1,
                        borderColor: errors.mercadoLivre ? '#ef4444' : '#334155',
                        borderRadius: 10,
                        padding: 12,
                        color: '#fff',
                        fontSize: 20,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  
                  {/* Avulso */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '600', marginBottom: 6, textAlign: 'center' }}>
                      🟩 AVULSO
                    </Text>
                    <TextInput
                      value={avulsoCount}
                      onChangeText={setAvulsoCount}
                      placeholder="0"
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      style={{
                        backgroundColor: '#1e293b',
                        borderWidth: 1,
                        borderColor: errors.avulso ? '#ef4444' : '#334155',
                        borderRadius: 10,
                        padding: 12,
                        color: '#fff',
                        fontSize: 20,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                </View>
                
                {/* Total */}
                <View style={{
                  backgroundColor: '#0f172a',
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#334155',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '600', marginBottom: 4 }}>
                    TOTAL DECLARADO
                  </Text>
                  <Text style={{ 
                    color: theme.colors.primary, 
                    fontSize: 24, 
                    fontWeight: '800',
                  }}>
                    {(Number(shopeeCount) || 0) + (Number(mercadoLivreCount) || 0) + (Number(avulsoCount) || 0)}
                  </Text>
                </View>
                
                {errors.total && (
                  <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{errors.total}</Text>
                )}
              </View>

              {/* Start Button */}
              <TouchableOpacity
                onPress={handleStart}
                activeOpacity={0.85}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 12,
                  padding: 18,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 1 }}>
                  INICIAR CONFERÊNCIA
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
