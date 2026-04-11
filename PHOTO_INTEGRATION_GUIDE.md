# 📸 Guia de Integração - Captura de Fotos de Pacotes

## Visão Geral

Este guia demonstra como integrar a funcionalidade de captura de fotos de pacotes no seu aplicativo Beep Velozz.

---

## 🎯 Componentes Criados

### 1. **PackagePhotoCapture.tsx**

Componente modal para capturar fotos dos pacotes.

**Recursos:**

- ✅ Interface de câmera nativa
- ✅ Controles (flash, inverter câmera)
- ✅ Preview e confirmar foto
- ✅ Haptics feedback
- ✅ Gerenciamento de permissões

### 2. **PackagePhotoGallery.tsx**

Componente para visualizar todas as fotos capturadas em uma sessão.

**Recursos:**

- ✅ Grid de fotos
- ✅ Visualização em destaque
- ✅ Deletar foto individual
- ✅ Estatísticas de cobertura
- ✅ Exportar PDF com fotos

### 3. **photoStorage.ts**

Utilitário para gerenciar armazenamento de fotos.

**Funções principais:**

```typescript
-initPhotoStorage() - // Inicializa diretório
  savePackagePhoto() - // Salva foto de pacote
  getSessionPhotos() - // Obtém fotos da sessão
  getPackagePhoto() - // Obtém foto específica
  deletePackagePhoto() - // Deleta foto
  deleteSessionPhotos() - // Deleta todas
  photoToBase64() - // Converte para base64
  getSessionPhotosSize() - // Calcula tamanho total
  formatFileSize(); // Formata tamanho
```

---

## 🔧 Instruções de Integração

### Step 1: Integrar com ScannerView

No componente `ScannerView.tsx`, adicione:

```tsx
import PackagePhotoCapture from "@/components/PackagePhotoCapture";
import { savePackagePhoto } from "@/utils/photoStorage";

export default function ScannerView({
  onScan,
  onDuplicate,
  packages,
  declaredCounts,
  lastScanned,
  onEndSession,
}: ScannerViewProps) {
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [photoCaptureCode, setPhotoCaptureCode] = useState("");

  const handlePackageScanned = (pkg: ScannedPackage) => {
    const accepted = onScan(pkg);

    // Perguntar se quer tirar foto após scan bem-sucedido
    if (accepted) {
      setPhotoCaptureCode(pkg.code);
      setShowPhotoCapture(true);
    }
  };

  const handlePhotoCapture = async (photoUri: string) => {
    try {
      // Obter a última sessão ID (você precisa rastrear isso)
      const savedPath = await savePackagePhoto(
        photoUri,
        photoCaptureCode,
        sessionId, // Use o ID da sessão atual
      );

      // Atualizar o pacote com a URI da foto salva
      const updatedPackages = packages.map((pkg) =>
        pkg.code === photoCaptureCode ? { ...pkg, photoUri: savedPath } : pkg,
      );

      // Se tiver callback para atualizar pacotes, use aqui
      console.log("Foto salva em:", savedPath);
    } catch (error) {
      console.error("Erro ao salvar foto:", error);
    }
  };

  return (
    <View>
      {/* Seu ScannerView existente */}

      {/* Adicionar modal de captura de foto */}
      <PackagePhotoCapture
        visible={showPhotoCapture}
        onClose={() => {
          setShowPhotoCapture(false);
          setPhotoCaptureCode("");
        }}
        onPhotoCapture={handlePhotoCapture}
        packageCode={photoCaptureCode}
      />
    </View>
  );
}
```

### Step 2: Integrar com ReportView

No componente `ReportView.tsx`, adicione:

```tsx
import PackagePhotoGallery from "@/components/PackagePhotoGallery";
import { exportSessionWithPhotosToPDF } from "@/utils/pdfExport";

export default function ReportView({
  session,
  onNewSession,
  onViewHistory,
}: ReportViewProps) {
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  const handleExportWithPhotos = async () => {
    try {
      await exportSessionWithPhotosToPDF(session);
    } catch (error) {
      console.error("Erro ao exportar PDF com fotos:", error);
    }
  };

  return (
    <View>
      {/* Seu ReportView existente */}

      {/* Adicionar botão para ver fotos */}
      <TouchableOpacity
        onPress={() => setShowPhotoGallery(true)}
        style={{
          width: "100%",
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: 15,
            fontWeight: "600",
            letterSpacing: 0.3,
          }}
        >
          📸 Ver Fotos ({countPackagesWithPhotos(session)} capturadas)
        </Text>
      </TouchableOpacity>

      {/* Se existem fotos, adicionar botão de exportar com fotos */}
      {hasPhotos(session) && (
        <TouchableOpacity
          onPress={handleExportWithPhotos}
          style={{
            width: "100%",
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 15,
              fontWeight: "700",
              letterSpacing: 0.3,
            }}
          >
            📄 Exportar PDF com Fotos
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal da galeria */}
      <PackagePhotoGallery
        session={session}
        visible={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        onExportWithPhotos={handleExportWithPhotos}
      />
    </View>
  );
}

// Funções auxiliares
function countPackagesWithPhotos(session: Session): number {
  return session.packages.filter((pkg) => pkg.photoUri).length;
}

function hasPhotos(session: Session): boolean {
  return session.packages.some((pkg) => pkg.photoUri);
}
```

---

## 🎥 Fluxo Recomendado

```
1. Scanner detecta código
   ↓
2. Pacote é adicionado à lista
   ↓
3. Modal de foto aparece (opcional)
   ↓
4. Operador tira foto do pacote
   ↓
5. Foto é salva localmente
   ↓
6. Próximo pacote (ou finalizar)
   ↓
7. Ao visualizar relatório, operador pode:
   - Ver galeria de fotos
   - Deletar fotos
   - Exportar PDF com fotos
```

---

## 📁 Estrutura de Armazenamento

As fotos são salvas em:

```
/Documents/package-photos/
├── sessionId_packageCode_timestamp.jpg
├── sessionId_packageCode_timestamp.jpg
└── ...
```

---

## 🚀 Otimizações Implementadas

✅ **Qualidade**: Fotos em 80% de qualidade (balanço tamanho/qualidade)  
✅ **Performance**: Conversão lazy para base64 apenas ao exportar  
✅ **Armazenamento**: Estrutura organizada por sessão  
✅ **Limpeza**: Função para deletar fotos de sessão concluída  
✅ **Estatísticas**: Cálculo de tamanho total e cobertura

---

## 📋 Checklist de Integração

- [ ] Implementar `PackagePhotoCapture` no `ScannerView`
- [ ] Implementar `PackagePhotoGallery` no `ReportView`
- [ ] Adicionar `photoUri` ao fluxo de pacotes
- [ ] Testar captura de foto
- [ ] Testar galeria de fotos
- [ ] Testar exportação de PDF com fotos
- [ ] Adicionar permissão de câmera em `app.json`
- [ ] Testar limpeza de fotos

---

## ⚙️ Configuração em app.json

Adicione as permissões necessárias:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone"
        }
      ]
    ]
  }
}
```

---

## 🐛 Troubleshooting

### Foto não salva

- Verificar permissão de armazenamento
- Verificar espaço disponível no dispositivo

### Modal não abre

- Verificar se `visible` é `true`
- Verificar permissão de câmera

### PDF não inclui fotos

- Executar `exportSessionWithPhotosToPDF` ao invés de `exportSessionToPDF`
- Certificar que fotos estão salvas

---

## 💾 Exemplo Completo de Integração

```tsx
// No MainLayout ou componente pai

const [sessionId, setSessionId] = useState("");
const [showPhotoModal, setShowPhotoModal] = useState(false);
const [photoPackageCode, setPhotoPackageCode] = useState("");

const handleNewPackageScanned = async (pkg: ScannedPackage) => {
  // Lógica existente
  const accepted = addPackage(pkg);

  // Novo: Solicitar foto
  if (accepted) {
    setPhotoPackageCode(pkg.code);
    setShowPhotoModal(true);
  }
};

const handlePhotoCapture = async (photoUri: string) => {
  try {
    const savedUri = await savePackagePhoto(
      photoUri,
      photoPackageCode,
      sessionId,
    );

    // Atualizar pacote com foto
    updatePackagePhoto(photoPackageCode, savedUri);
    setShowPhotoModal(false);
  } catch (error) {
    Alert.alert("Erro", "Não foi possível salvar a foto");
  }
};

return (
  <View>
    <ScannerView onScan={handleNewPackageScanned} />

    <PackagePhotoCapture
      visible={showPhotoModal}
      packageCode={photoPackageCode}
      onPhotoCapture={handlePhotoCapture}
      onClose={() => setShowPhotoModal(false)}
    />
  </View>
);
```

---

**Pronto para usar! 🎉**
