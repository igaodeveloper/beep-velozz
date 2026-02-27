import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScannedPackage } from '@/types/session';
import { formatTimestamp, packageTypeLabel, packageTypeBadgeColors } from '@/utils/session';

interface PackageListProps {
  packages: ScannedPackage[];
  expanded: boolean;
  onToggle: () => void;
}

export default function PackageList({ packages, expanded, onToggle }: PackageListProps) {
  return (
    <View style={{
      backgroundColor: '#0a0f1e',
      borderTopWidth: 1,
      borderTopColor: '#1e293b',
    }}>
      {/* Header toggle */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
            PACOTES ESCANEADOS
          </Text>
          <View style={{
            backgroundColor: '#1e293b', borderRadius: 10,
            paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>
              {packages.length}
            </Text>
          </View>
        </View>
        <Text style={{ color: '#64748b', fontSize: 18 }}>
          {expanded ? '▼' : '▲'}
        </Text>
      </TouchableOpacity>

      {/* List */}
      {expanded && (
        <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
          {packages.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#334155', fontSize: 14 }}>Nenhum pacote escaneado</Text>
            </View>
          ) : (
            [...packages].reverse().map((pkg, idx) => {
              const badge = packageTypeBadgeColors(pkg.type);
              return (
                <View
                  key={pkg.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: '#1e293b',
                  }}
                >
                  {/* Index */}
                  <Text style={{ color: '#334155', fontSize: 11, width: 28, fontWeight: '600' }}>
                    #{packages.length - idx}
                  </Text>
                  {/* Code */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '600', fontFamily: 'SpaceMono-Regular' }}>
                      {pkg.code}
                    </Text>
                    <Text style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                      {formatTimestamp(pkg.scannedAt)}
                    </Text>
                  </View>
                  {/* Badge */}
                  <View style={{
                    backgroundColor: badge.bg,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}>
                    <Text style={{ color: badge.text, fontSize: 10, fontWeight: '700' }}>
                      {packageTypeLabel(pkg.type)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 8 }} />
        </ScrollView>
      )}
    </View>
  );
}
