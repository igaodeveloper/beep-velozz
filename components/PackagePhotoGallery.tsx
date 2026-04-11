import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Session } from "@/types/session";
import { useAppTheme } from "@/utils/useAppTheme";
import {
  getSessionPhotos,
  deletePackagePhoto,
  formatFileSize,
  getSessionPhotosSize,
} from "@/utils/photoStorage";

interface PackagePhotoGalleryProps {
  session: Session;
  visible: boolean;
  onClose: () => void;
  onExportWithPhotos?: () => void;
}

export default function PackagePhotoGallery({
  session,
  visible,
  onClose,
  onExportWithPhotos,
}: PackagePhotoGalleryProps) {
  const { colors } = useAppTheme();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    if (visible) {
      loadPhotos();
    }
  }, [visible]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const sessionPhotos = await getSessionPhotos(session.id);
      setPhotos(sessionPhotos);

      const size = await getSessionPhotosSize(session.id);
      setTotalSize(size);
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoUri: string) => {
    try {
      await deletePackagePhoto(photoUri);
      setPhotos(photos.filter((p) => p.uri !== photoUri));
      setTotalSize(totalSize - (await getSessionPhotosSize(session.id)));
    } catch (error) {
      console.error("Erro ao deletar foto:", error);
    }
  };

  return (
    <>
      {/* Modal Principal */}
      <Modal
        visible={visible && !selectedPhoto}
        transparent
        animationType="slide"
      >
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.surface2,
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                GALERIA DE FOTOS
              </Text>
              <Text
                style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}
              >
                {photos.length} foto{photos.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 300,
                }}
              >
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textMuted, marginTop: 12 }}>
                  Carregando fotos...
                </Text>
              </View>
            ) : photos.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                }}
              >
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📸</Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  Nenhuma foto capturada
                </Text>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Capture fotos dos pacotes durante a conferência
                </Text>
              </View>
            ) : (
              <>
                {/* Info Card */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.surface2,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      FOTOS CAPTURADAS
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {photos.length}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      TAMANHO TOTAL
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {formatFileSize(totalSize)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      COBERTURA
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {(
                        (photos.length / session.packages.length) *
                        100
                      ).toFixed(0)}
                      %
                    </Text>
                  </View>
                </View>

                {/* Photo Grid */}
                <View style={{ gap: 12, marginBottom: 20 }}>
                  {photos.map((photo) => (
                    <PhotoCard
                      key={photo.uri}
                      photo={photo}
                      onSelect={() => setSelectedPhoto(photo)}
                      onDelete={() => handleDeletePhoto(photo.uri)}
                      colors={colors}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          {photos.length > 0 && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 20,
                borderTopWidth: 1,
                borderTopColor: colors.surface2,
                gap: 12,
              }}
            >
              {onExportWithPhotos && (
                <TouchableOpacity
                  onPress={() => {
                    onExportWithPhotos();
                    onClose();
                  }}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: "700",
                      letterSpacing: 0.3,
                    }}
                  >
                    📄 Exportar PDF com Fotos
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={loadPhotos}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  🔄 Atualizar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <Modal visible={true} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setSelectedPhoto(null)}
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: selectedPhoto.uri }}
              style={{
                width: "90%",
                height: 600,
                borderRadius: 14,
                resizeMode: "contain",
              }}
            />

            <View style={{ marginTop: 24, gap: 8, width: "90%" }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 10,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  CÓDIGO DO PACOTE
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {selectedPhoto.packageCode}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  handleDeletePhoto(selectedPhoto.uri);
                  setSelectedPhoto(null);
                }}
                style={{
                  backgroundColor: "#ef4444",
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                >
                  🗑️ Deletar Foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPhoto(null)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

interface PhotoCardProps {
  photo: any;
  onSelect: () => void;
  onDelete: () => void;
  colors: any;
}

function PhotoCard({ photo, onSelect, onDelete, colors }: PhotoCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.surface2,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        onPress={onSelect}
        style={{ width: "100%", height: 200 }}
      >
        <Image
          source={{ uri: photo.uri }}
          style={{
            width: "100%",
            height: "100%",
            resizeMode: "cover",
          }}
        />
      </TouchableOpacity>

      <View style={{ padding: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 10,
                fontWeight: "600",
                marginBottom: 2,
              }}
            >
              PACOTE
            </Text>
            <Text
              style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}
            >
              {photo.packageCode}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDelete}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.textMuted, fontSize: 10 }}>
          {new Date(photo.timestamp).toLocaleString("pt-BR")}
        </Text>
      </View>
    </View>
  );
}
