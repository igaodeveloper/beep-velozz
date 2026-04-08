# 🎯 Padrões de Mercado Livre Identificados

## Etiqueta Analisada
**Data**: 08 ABR | **Tipo**: FLEX RESIDENCIAL

---

## Códigos Principais Extraídos

### 1. **Pack ID** (Principal)
```
2200D 1241459785
→ Normalizado: 2200D1241459785
→ Prefixo: 2200D (5 caracteres)
→ Comprimento: 14 caracteres
→ Padrão: [DIGIT][DIGIT][DIGIT][DIGIT][LETTER][DIGIT...] (numérico + letra + numéricos)
```

### 2. **Envio ID** (Alternativo)
```
4482D24 7404
→ Normalizado: 4482D247404
→ Prefixo: 4482D24 (7 caracteres)
→ Comprimento: 11 caracteres
→ Padrão: Similar ao Pack ID
```

### 3. **CEP** (Localização)
```
02464000
→ Pode começar com 20/02
→ 8 dígitos totais
→ Nota: CEPs como 02464000 NÃO devem ser confundidos com 20000-prefix ML
```

---

## Informações de Endereço
- **CEP**: 02464000
- **Bairro**: Imirim (NORTE 1)
- **Rua**: Avenida Imirim 702
- **Complemento**: Apartamento 15
- **Destinatário**: Luana Ribeiro Magalhães (LURIBEIROMAGA)

---

## Padrões Reconhecidos Agora

| Prefixo | Comprimento Mín | Tipo | Status |
|---------|-----------------|------|--------|
| `2200D` | 9 | mercado_livre | ✅ NOVO |
| `4482D` | 9 | mercado_livre | ✅ NOVO |
| `20000` | 5 | mercado_livre | ✅ EXISTENTE |
| `466` | 11 | mercado_livre | ✅ EXISTENTE |
| `BR` | 8 | shopee | ✅ EXISTENTE |
| `LM` | 4 | avulso | ✅ EXISTENTE |
| `14` | 4 | avulso | ✅ EXISTENTE |

---

## Bipes Esperados

```
código: 2200D1241459785
  ↓
identifyPackage() → "mercado_livre"
  ↓
mapToAudio() → ScannerAudioType.BEEP_B
  ↓
playAudio() → 🔊 BEEP_B (Mercado Livre)
```

---

## Validação de Entrada

### Normalização (sem espaços, maiúsculas)
```
"2200D 1241459785"  → remove espaços → "2200D1241459785"
"4482D247404"       → já normalizado
"02464000"          → já normalizado
```

### Prefixo Matching (ordem importante)
1. Testa `2200D` → ✅ Match → tipo = mercado_livre
2. Se não, testa `4482D` → ✅ Match → tipo = mercado_livre
3. Se não, testa `20000` → possível match
4. Se não, testa `466` → possível match
5. ... e assim por diante

---

## QR Code
- Presente na etiqueta
- Provavelmente contém o Pack ID: `2200D1241459785` ou similar
- Quando escaneado, deve ser normalizado e identificado como **mercado_livre**

---

## Teste Implementado

Arquivo: `TEST_ML_PATTERNS.ts`

Testes casos cobertos:
- ✅ Pack ID com/sem espaço
- ✅ Código de envio 4482D com/sem espaço  
- ✅ CEP
- ✅ Padrões tradicionais (20000, 466)
- ✅ Com prefixo ID adicionado por alguns scanners

**Resultado esperado**: Todos os testes devem passar ✅

---

## Próximos Passos

1. ✅ **Padrões adicionados** ao `scannerIdentification.ts`
2. ✅ **Áudio integrado** no `ProductionOptimizedScanner.tsx`
3. ⏳ **Testar com etiqueta real** (simular QR code)
4. ⏳ **Validar bipe** na app (BEEP_B para Mercado Livre)
