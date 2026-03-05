import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useAppTheme } from '@/utils/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { Driver } from '@/services/firestore';
import DriversSelector from '@/components/DriversSelector';

interface SessionInitModalProps {
  visible: boolean;
  onStart: (
    operatorName: string,
    driverName: string,
    declaredCounts: { shopee: number; mercadoLivre: number; avulso: number },
    driverId?: string
  ) => void;
}

export default function SessionInitModal({ visible, onStart }: SessionInitModalProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  const [operatorName, setOperatorName] = useState('');
  const [driverId, setDriverId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [shopeeCount, setShopeeCount] = useState('');
  const [mercadoLivreCount, setMercadoLivreCount] = useState('');
  const [avulsoCount, setAvulsoCount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!operatorName.trim()) newErrors.operatorName = 'Campo obrigatório';
    if (!driverId) newErrors.driverName = 'Campo obrigatório';
    
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
    const driverName = drivers.find(d => d.id === driverId)?.name || '';
    const declaredCounts = {
      shopee: Number(shopeeCount) || 0,
      mercadoLivre: Number(mercadoLivreCount) || 0,
      avulso: Number(avulsoCount) || 0,
    };
    onStart(operatorName.trim(), driverName, declaredCounts, driverId || undefined);
    setOperatorName('');
    setDriverId(null);
    setShopeeCount('');
    setMercadoLivreCount('');
    setAvulsoCount('');
    setErrors({});
  };

  useEffect(() => {
    async function loadDrivers() {
      setLoadingDrivers(true);
      try {
        const { fetchDriversWithCache } = await import('@/services/firestore');
        const list = await fetchDriversWithCache();
        setDrivers(list);
      } catch (e) {
        console.warn('failed load drivers', e);
      } finally {
        setLoadingDrivers(false);
      }
    }
    loadDrivers();
  }, []);

  const handleAddDriver = async (name: string) => {
    try {
      const { upsertDriver, fetchDriversWithCache } = await import('@/services/firestore');
      await upsertDriver({ name: name.trim(), active: true });
      const updated = await fetchDriversWithCache();
      setDrivers(updated);
    } catch (e) {
      console.warn('failed to add driver', e);
      throw e;
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    try {
      const { deleteDriver, fetchDriversWithCache } = await import('@/services/firestore');
      await deleteDriver(driverId);
      const updated = await fetchDriversWithCache();
      setDrivers(updated);
    } catch (e) {
      console.warn('failed to delete driver', e);
      throw e;
    }
  };


  return (
    <Modal visible={visible} transparent animationType="fade">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            width: '100%',
            paddingHorizontal: 20,
            maxWidth: 640,
            alignSelf: 'center',
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 20 }}>
              {/* larger square container with no solid background and rounded corners */}
              <View style={{
                width: 120, height: 120, borderRadius: 24,
                backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                overflow: 'hidden' // ensure image respects corners
              }}>
                <Image
                  source={require('../assets/images/session.png')}
                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                />
              </View>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 }}>
                beep velozz
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                Preencha os dados antes de iniciar
              </Text>
            </View>

            {/* Form Card */}
            <Animated.View
              entering={FadeInDown.duration(320)}
              exiting={FadeOutDown.duration(220)}
              style={{
                backgroundColor: colors.surface, borderRadius: 16,
                borderWidth: 1, borderColor: colors.border, padding: 24,
              }}
            >
              {/* Operator Name */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
                  Operador
                </Text>
                <TextInput
                  value={operatorName}
                  onChangeText={setOperatorName}
                  placeholder="Nome do operador"
                  placeholderTextColor={colors.textSubtle}
                  style={{
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: errors.operatorName ? colors.danger : colors.border2,
                    borderRadius: 10,
                    padding: 14,
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                />
                {errors.operatorName && (
                  <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{errors.operatorName}</Text>
                )}
              </View>

              {/* Driver Selector */}
              <DriversSelector
                drivers={drivers}
                selectedDriverId={driverId}
                onSelectionChange={setDriverId}
                onAddDriver={handleAddDriver}
                onDeleteDriver={handleDeleteDriver}
                loadingDrivers={loadingDrivers}
              />

              {/* Declared Counts */}
              <View style={{ marginBottom: 28 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>
                  Qtd. Declarada por Tipo
                </Text>
                
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {/* Shopee */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fb923c', fontSize: 10, fontWeight: '600', marginBottom: 8, textAlign: 'center', textTransform: 'uppercase' }}>
                      🟧 Shopee
                    </Text>
                    <TextInput
                      value={shopeeCount}
                      onChangeText={setShopeeCount}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.surface2,
                        borderWidth: 1,
                        borderColor: errors.shopee ? colors.danger : colors.border2,
                        borderRadius: 10,
                        padding: 14,
                        color: colors.text,
                        fontSize: 20,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  
                  {/* Mercado Livre */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffe600', fontSize: 10, fontWeight: '600', marginBottom: 8, textAlign: 'center', textTransform: 'uppercase' }}>
                      🟨 Mercado Livre
                    </Text>
                    <TextInput
                      value={mercadoLivreCount}
                      onChangeText={setMercadoLivreCount}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.surface2,
                        borderWidth: 1,
                        borderColor: errors.mercadoLivre ? colors.danger : colors.border2,
                        borderRadius: 10,
                        padding: 14,
                        color: colors.text,
                        fontSize: 20,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  
                  {/* Avulso */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.success, fontSize: 10, fontWeight: '600', marginBottom: 8, textAlign: 'center', textTransform: 'uppercase' }}>
                      🟩 Avulso
                    </Text>
                    <TextInput
                      value={avulsoCount}
                      onChangeText={setAvulsoCount}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.surface2,
                        borderWidth: 1,
                        borderColor: errors.avulso ? colors.danger : colors.border2,
                        borderRadius: 10,
                        padding: 14,
                        color: colors.text,
                        fontSize: 20,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                </View>

                {/* Total */}
                <View style={{
                  backgroundColor: colors.surface2,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border2,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 4 }}>
                    TOTAL DECLARADO
                  </Text>
                  <Text style={{ 
                    color: colors.primary, 
                    fontSize: 24, 
                    fontWeight: '800',
                  }}>
                    {(Number(shopeeCount) || 0) + (Number(mercadoLivreCount) || 0) + (Number(avulsoCount) || 0)}
                  </Text>
                </View>
                
                {errors.total && (
                  <Text style={{ color: colors.danger, fontSize: 12, marginTop: 8, textAlign: 'center' }}>{errors.total}</Text>
                )}
              </View>

              {/* Start Button */}
              <TouchableOpacity
                onPress={handleStart}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 18,
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 480,
                  alignSelf: 'center',
                }}
              >
                <Text style={{ color: colors.secondary, fontSize: 17, fontWeight: '800', letterSpacing: 1 }}>
                  INICIAR CONFERÊNCIA
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
