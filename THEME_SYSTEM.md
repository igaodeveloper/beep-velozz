# Sistema de Tema Dinâmico

## Visão Geral
O projeto agora possui um sistema completo de tema claro e escuro, com cores primárias laranja e secundárias brancas.

## Cores Disponíveis

### Tema Claro (Light)
- **bg**: `#ffffff` - Fundo principal
- **surface**: `#f9fafb` - Cards e superfícies  
- **surface2**: `#f3f4f6` - Superfícies secundárias
- **border**: `#e5e7eb` - Bordas principais
- **border2**: `#d1d5db` - Bordas secundárias
- **text**: `#111827` - Texto principal
- **textMuted**: `#6b7280` - Texto mutado/labels
- **textSubtle**: `#9ca3af` - Texto sutil/placeholder
- **textFaint**: `#d1d5db` - Texto muito sutil

### Tema Escuro (Dark)
- **bg**: `#0f172a` - Fundo principal
- **surface**: `#1e293b` - Cards e superfícies
- **surface2**: `#0f172a` - Superfícies secundárias
- **border**: `#334155` - Bordas principais
- **border2**: `#475569` - Bordas secundárias
- **text**: `#f8fafc` - Texto principal
- **textMuted**: `#cbd5e1` - Texto mutado/labels
- **textSubtle**: `#94a3b8` - Texto sutil/placeholder
- **textFaint**: `#64748b` - Texto muito sutil

### Cores Acentuadas (Ambos Temas)
- **primary**: `#f97316` - Laranja (cor primária)
- **primary2**: `#fb923c` - Laranja claro (variante)
- **primaryLight**: `#fedba74` - Laranja muito claro
- **primaryDark**: `#ea580c` - Laranja escuro
- **secondary**: Branco (tema light) / `#1e293b` (tema dark)
- **secondaryText**: `#111827` (light) / `#f8fafc` (dark)
- **success**: `#10b981` - Verde (sucesso)
- **danger**: `#ef4444` - Vermelho (erro/perigo)
- **warning**: `#f59e0b` - Amarelo (aviso)

## Como Usar

### Em um Componente Funcional

```tsx
import { useAppTheme } from '@/utils/useAppTheme';

export default function MeuComponente() {
  const { isDark, colors } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.text }}>
        Texto com tema dinâmico
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: colors.primary }}
      >
        <Text style={{ color: colors.secondary }}>Botão</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Toggle de Tema

Para permitir que o usuário alterne entre light/dark:

```tsx
import { useTheme } from '@/utils/themeContext';

export default function MeuComponente() {
  const { colorScheme, setColorScheme, isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => setColorScheme(isDark ? 'light' : 'dark')}
    >
      <Text>Alternar Tema</Text>
    </TouchableOpacity>
  );
}
```

## Estrutura do Sistema de Tema

### Arquivos Principais

- **utils/theme.ts** - Define as paletas de cores (`lightTheme`, `darkTheme`)
- **utils/themeContext.tsx** - Contexto React que gerencia o estado do tema
- **utils/useAppTheme.ts** - Hook customizado que combina tema + contexto
- **components/ThemeToggle.tsx** - Componente de botão para alternar tema
- **app/_layout.tsx** - Layout raiz com ThemeProvider

### Como o Tema é Persistido

O tema selecionado é salvo no AsyncStorage e é recuperado na inicialização do app:
- Tema do sistema é usado como fallback se nenhuma preferência foi salva
- A preferência é salua automicamente quando o usuário alterna o tema

## Tailwind CSS com Dark Mode

O `tailwind.config.js` está configurado com `darkMode: 'class'`, permitindo estilos específicos do dark mode:

```tsx
<View className="bg-white dark:bg-slate-900">
  {/* ... */}
</View>
```

## Recomendações de Uso

1. **Sempre use `useAppTheme()`** para obter as cores atuais
2. **Evite cores hardcoded** - use sempre a paleta de cores do tema
3. **Para novos componentes**, copie o padrão:
   ```tsx
   const { colors } = useAppTheme();
   ```
4. **Use cores semânticas** ao invés de cores literais:
   - `colors.danger` ao invés de especificar `#ef4444`
   - `colors.primary` ao invés de `#f97316`
5. **Teste em ambos os temas** durante o desenvolvimento

## Transições Suaves

As transições entre temas são automáticas e suaves. Se necessário adicionar animações personalizadas, use:

```tsx
const { isDark } = useAppTheme();

useEffect(() => {
  // Faça algo quando o tema mudar
}, [isDark]);
```
