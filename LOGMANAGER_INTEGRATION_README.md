# Integração LogManager API

Este documento descreve a integração completa com a API da LogManager para consulta de pedidos em tempo real no aplicativo BeepVelozz.

## 📋 Visão Geral

A integração permite que o scanner de códigos de barras do aplicativo consulte automaticamente a API da LogManager para localizar pedidos correspondentes de diferentes marketplaces (Shopee, Mercado Livre, pedidos avulsos, etc.).

## 🏗️ Arquitetura

```
src/
├── api/
│   ├── axiosClient.ts          # Cliente Axios configurado
│   └── logmanagerApi.ts        # Chamadas específicas da API
├── services/
│   └── pedidosService.ts       # Serviço de negócio para pedidos
├── hooks/
│   └── usePedidoScanner.ts     # Hook React para scanner
├── types/
│   └── Pedido.ts               # Interfaces TypeScript
├── utils/
│   └── scannerParser.ts        # Parser inteligente de códigos
├── config/
│   └── apiConfig.ts            # Configurações da API
└── index.ts                    # Exportações centralizadas
```

## 🔧 Configuração

### Dependências

Certifique-se de que o `axios` está instalado:

```bash
npm install axios
```

### Token de Autenticação

O token está configurado no arquivo `apiConfig.ts`:

```typescript
const API_CONFIG = {
  TOKEN: 'ciU5BsWP0mPOBhVyxSA6xBw5MOBJua1nCsHUQVuZ6u09NTJwgoJfx2PsI1urZmk9XHjmr5XIabI77CC3POgcTLPrKMBQ5IR1baXc0uaQYxZaJgMxwTj1G2J0LSptSZqSSgphXFBDmLYVpXyKP5LRn4ZPTciV9XQIsr6xAxUQwK2ZGraIuOAHakSBZkr761e1ddedcce8a',
  // ... outras configurações
};
```

### URL Base da API

```typescript
const API_CONFIG = {
  BASE_URL: 'https://app.logmanager.com.br/api',
  // ...
};
```

## � Como Usar

### Importações Centralizadas

```typescript
import {
  usePedidoScanner,
  PedidosService,
  ScannerParser,
  Pedido,
  PEDIDO_TYPES
} from '../src';
```

### Importações Individuais

```typescript
import { usePedidoScanner } from '../src/hooks/usePedidoScanner';
import { PedidosService } from '../src/services/pedidosService';
import { ScannerParser } from '../src/utils/scannerParser';
import type { Pedido } from '../src/types/Pedido';
```

### Interfaces Principais

```typescript
interface Pedido {
  id: string;
  codigo: string;
  tipo: 'SHOPEE' | 'MERCADO_LIVRE' | 'LOGMANAGER' | 'AVULSO';
  cliente: Cliente;
  entrega: Entrega;
  status: StatusPedido;
  dataCriacao: string;
  dataAtualizacao: string;
  valorTotal: number;
  itens: ItemPedido[];
}

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
}

interface Entrega {
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  transportadora?: string;
  codigoRastreamento?: string;
}
```

## 🔍 Parser de Códigos

O `ScannerParser` identifica automaticamente o tipo de código escaneado:

### Padrões Reconhecidos

- **Shopee**: `SPXBR12345678` → `SHOPEE`
- **Mercado Livre**: `MLB123456789` → `MERCADO_LIVRE`
- **LogManager**: `BR1234567890` → `LOGMANAGER`
- **Avulsos**: Códigos alfanuméricos genéricos → `AVULSO`

### Exemplo de Uso

```typescript
import { ScannerParser } from '../utils/scannerParser';

const parsed = ScannerParser.parseCode('SPXBR12345678');
console.log(parsed);
// {
//   codigo: 'SPXBR12345678',
//   tipo: 'SHOPEE',
//   valido: true
// }
```

## 🎣 Hook usePedidoScanner

Hook React que gerencia a busca de pedidos com debounce e cancelamento automático.

### Uso Básico

```typescript
import { usePedidoScanner } from '../hooks/usePedidoScanner';

const MyComponent = () => {
  const { loading, pedido, erro, searchPedido } = usePedidoScanner();

  const handleCodeScanned = (code: string) => {
    searchPedido(code); // Busca com debounce automático
  };

  if (loading) return <Text>Carregando...</Text>;
  if (erro) return <Text>Erro: {erro}</Text>;
  if (pedido) return <Text>Pedido: {pedido.codigo}</Text>;

  return <Text>Digite um código</Text>;
};
```

### Opções do Hook

```typescript
const options = {
  debounceMs: 500,    // Delay para busca automática (padrão: 500ms)
  autoSearch: true,   // Busca automática ao digitar (padrão: true)
};

const { manualSearch, clearState } = usePedidoScanner(options);
```

## 🌐 Cliente Axios

Configurado com:

- **Base URL**: `https://app.logmanager.com.br/api`
- **Timeout**: 30 segundos
- **Autenticação**: Bearer token
- **Interceptors**: Logs em desenvolvimento e tratamento de erros
- **Retry automático**: Até 3 tentativas para falhas de rede

## 📊 Serviço de Pedidos

### Métodos Disponíveis

```typescript
import { PedidosService } from '../services/pedidosService';

// Buscar pedido por código
const response = await PedidosService.buscarPedidoPorCodigo('SPXBR12345678');

// Listar pedidos
const pedidos = await PedidosService.listarPedidos(1, 50);

// Buscar por status
const pedidosFiltrados = await PedidosService.buscarPedidosPorStatus('EM_TRANSITO');

// Cache
PedidosService.limparCache();
const stats = PedidosService.getCacheStats();
```

### Cache Inteligente

- **Duração**: 5 minutos
- **Limpeza automática**: Ao atualizar status de pedidos
- **Estatísticas**: Acompanhamento de uso do cache

## ⚡ Performance

### Otimizações Implementadas

1. **Debounce**: Evita múltiplas requisições durante digitação
2. **Cancelamento**: Requisições duplicadas são canceladas automaticamente
3. **Cache**: Pedidos consultados recentemente são armazenados em memória
4. **Retry**: Tentativas automáticas para falhas temporárias
5. **Timeout**: Prevenção de requisições travadas

## 🛡️ Tratamento de Erros

### Tipos de Erro Tratados

- **401**: Token inválido/expirado
- **404**: Pedido não encontrado
- **429**: Rate limiting (muitas requisições)
- **500**: Erro interno do servidor
- **Timeout**: Requisição demorou demais
- **Rede**: Problemas de conectividade

### Mensagens de Erro

Todas as mensagens são em português e orientam o usuário sobre próximos passos.

## 📱 Exemplo de Componente

O arquivo `PedidoScannerExample.tsx` demonstra o uso completo da integração:

- Input para código
- Parsing automático
- Exibição de resultados
- Tratamento de estados (loading, erro, sucesso)
- Exemplos de códigos para teste

## 🧪 Testes

Para testar a integração:

1. Use os códigos de exemplo no componente
2. Verifique os logs no console (modo desenvolvimento)
3. Teste cenários de erro (códigos inválidos, sem internet)

## 🚀 Produção

### Configurações para Produção

- Logs apenas em `__DEV__`
- Retry automático habilitado
- Cache ativo
- Timeout otimizado

### Monitoramento

```typescript
// Verificar estatísticas do cache
const cacheStats = PedidosService.getCacheStats();
console.log('Cache hits:', cacheStats.size);
```

## 🔄 Compatibilidade

- ✅ **Expo**: Totalmente compatível
- ✅ **React Native**: Funciona em iOS e Android
- ✅ **TypeScript**: Tipagem completa
- ✅ **Axios**: Cliente HTTP confiável

## 📋 Checklist de Implementação

- [x] Cliente Axios configurado
- [x] Tipagem TypeScript completa
- [x] Parser inteligente de códigos
- [x] Serviço de pedidos com cache
- [x] Hook React com debounce
- [x] Tratamento de erros robusto
- [x] Exemplo de componente funcional
- [x] Performance otimizada
- [x] Documentação completa
- [x] Configurações centralizadas
- [x] Exportações centralizadas
- [x] Compatibilidade Expo verificada

## 🎯 Próximos Passos

1. **Integração com Scanner Real**: Conectar com câmera/escâner nativo
2. **Notificações**: Alertas para status de pedidos
3. **Sincronização**: Cache offline para uso sem internet
4. **Analytics**: Métricas de uso e performance
5. **Testes Unitários**: Cobertura completa com Jest

---

**Nota**: Esta integração está pronta para produção e segue as melhores práticas de desenvolvimento React Native com TypeScript.