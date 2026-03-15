import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/utils/useAppTheme';
import { useResponsive } from '@/utils/useResponsive';
import { MaterialIcons } from '@expo/vector-icons';
import { Driver } from '@/services/firestore';
import DriversSelector from '@/components/DriversSelector';
import BottomTabNavigator, { TabType } from '@/components/BottomTabNavigator';
import TabLayout from '@/components/TabLayout';

export default function NewSessionScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const responsive = useResponsive();
  const [activeTab, setActiveTab] = useState<TabType>('home');

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
    
    // Pass session data back to main screen
    router.push({
      pathname: '/',
      params: {
        sessionData: JSON.stringify({
          operatorName: operatorName.trim(),
          driverName,
          declaredCounts,
          driverId: driverId || undefined
        })
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleTabChange = (tab: TabType) => {
    // Navigate to other screens if needed
    if (tab === 'scanner') {
      router.push('/');
    } else if (tab === 'analytics') {
      router.push('/');
    } else if (tab === 'history') {
      router.push('/');
    } else if (tab === 'settings') {
      router.push('/');
    }
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
    <TabLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showScannerTab={false}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 16 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: '600',
          }}>
            Nova Sessão
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20 }}
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: responsive.isTablet ? 140 : 120, 
                height: responsive.isTablet ? 140 : 120, 
                borderRadius: responsive.borderRadius.xxl,
                backgroundColor: 'transparent', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: responsive.padding.md,
                overflow: 'hidden'
              }}>
                <Image
                  source={require('../assets/images/session.png')}
                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                />
              </View>
              <Text style={{ 
                color: colors.text, 
                fontSize: responsive.fontSize.xxxl, 
                fontWeight: '800', 
                letterSpacing: 1 
              }}>
                beep velozz
              </Text>
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: responsive.fontSize.sm, 
                marginTop: responsive.spacing.xs 
              }}>
                Preencha os dados antes de iniciar
              </Text>
            </View>

            {/* Form Card */}
            <Animated.View
              entering={FadeInDown.duration(320)}
              style={{
                backgroundColor: colors.surface, 
                borderRadius: responsive.borderRadius.xl,
                borderWidth: 1, 
                borderColor: colors.border, 
                padding: responsive.isTablet ? responsive.padding.xl : responsive.padding.lg,
              }}
            >
              {/* Operator Name */}
              <View style={{ marginBottom: responsive.padding.lg }}>
                <Text style={{ 
                  color: colors.textMuted, 
                  fontSize: responsive.fontSize.xs, 
                  fontWeight: '700', 
                  letterSpacing: 1.5, 
                  marginBottom: responsive.spacing.sm, 
                  textTransform: 'uppercase' 
                }}>
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
                    borderRadius: responsive.borderRadius.md,
                    padding: responsive.padding.md,
                    color: colors.text,
                    fontSize: responsive.fontSize.md,
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
              <View style={{ marginBottom: responsive.padding.xxl }}>
                <Text style={{ 
                  color: colors.textMuted, 
                  fontSize: responsive.fontSize.xs, 
                  fontWeight: '700', 
                  letterSpacing: 1.5, 
                  marginBottom: responsive.padding.md, 
                  textTransform: 'uppercase' 
                }}>
                  Qtd. Declarada por Tipo
                </Text>
                
                <View
                  style={{
                    flexDirection: 'row',
                    gap: responsive.spacing.md,
                    marginBottom: responsive.padding.md,
                  }}
                >
                  {/* Shopee */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: '#fb923c', 
                      fontSize: responsive.fontSize.xs, 
                      fontWeight: '600', 
                      marginBottom: responsive.spacing.sm, 
                      textAlign: 'center', 
                      textTransform: 'uppercase' 
                    }}>
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
                        borderRadius: responsive.borderRadius.md,
                        padding: responsive.padding.md,
                        color: colors.text,
                        fontSize: responsive.fontSize.xxl,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  
                  {/* Mercado Livre */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: '#ffe600', 
                      fontSize: responsive.fontSize.xs, 
                      fontWeight: '600', 
                      marginBottom: responsive.spacing.sm, 
                      textAlign: 'center', 
                      textTransform: 'uppercase' 
                    }}>
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
                        borderRadius: responsive.borderRadius.md,
                        padding: responsive.padding.md,
                        color: colors.text,
                        fontSize: responsive.fontSize.xxl,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  
                  {/* Avulso */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: colors.success, 
                      fontSize: responsive.fontSize.xs, 
                      fontWeight: '600', 
                      marginBottom: responsive.spacing.sm, 
                      textAlign: 'center', 
                      textTransform: 'uppercase' 
                    }}>
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
                        borderRadius: responsive.borderRadius.md,
                        padding: responsive.padding.md,
                        color: colors.text,
                        fontSize: responsive.fontSize.xxl,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    />
                  </View>
                </View>

                {/* Total */}
                <View style={{
                  backgroundColor: colors.surface2,
                  borderRadius: responsive.borderRadius.md,
                  padding: responsive.padding.md,
                  borderWidth: 1,
                  borderColor: colors.border2,
                  alignItems: 'center',
                }}>
                  <Text style={{ 
                    color: colors.textMuted, 
                    fontSize: responsive.fontSize.xs, 
                    fontWeight: '600', 
                    marginBottom: responsive.spacing.xs 
                  }}>
                    TOTAL DECLARADO
                  </Text>
                  <Text style={{ 
                    color: colors.primary, 
                    fontSize: responsive.fontSize.xxxl, 
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
                  borderRadius: responsive.borderRadius.md,
                  padding: responsive.isTablet ? responsive.padding.xl : responsive.padding.lg,
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: responsive.maxWidth.xl,
                  alignSelf: 'center',
                }}
              >
                <Text style={{ 
                  color: colors.secondary, 
                  fontSize: responsive.fontSize.xl, 
                  fontWeight: '800', 
                  letterSpacing: 1 
                }}>
                  INICIAR CONFERÊNCIA
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={{ height: responsive.spacing.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TabLayout>
  );
}
