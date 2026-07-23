# 🔍 Debug - Carrinho Sendo Limpo ao Navegar

## 🐛 **PROBLEMA REPORTADO**

```
1. Adiciona produto A ao carrinho ✅
2. FloatingCart mostra item ✅
3. Continua comprando ✅
4. Abre produto B
5. ❌ Carrinho fica vazio (itens removidos)
```

---

## 🔧 **LOGS DE DEBUG ADICIONADOS**

### **O que foi implementado:**

Quando você navegar para outro produto, o console mostrará:

```javascript
// Ao carregar página:
🛒 Carregando itens do carrinho do localStorage: 1
📋 Items do localStorage (RAW): [{ ... }]  ← Estado bruto

// Para cada item:
🔍 validateCartItem - Debug store_id: {
  productName: "Produto A",
  price: 518.70,
  hasGradeInfo: true,
  ...
}

// Se FALHAR:
⚠️ validateCartItem - [RAZÃO ESPECÍFICA]: dados

// Resultado final:
✅ Itens válidos encontrados: 0  ← Se 0, todos foram removidos!
📊 Resultado da validação: [{
  index: 0,
  productName: "Produto A",
  isValid: false,              ← Por que false?
  failedReason: "Ver logs acima"  ← Ver qual validação falhou
}]

// Se itens removidos:
❌ 1 itens REMOVIDOS por validação: [{
  productName: "Produto A",
  productId: "xxx",
  price: 518.70,
  quantity: 1,
  hasGradeInfo: true,
  variation: { ... }
}]
```

---

## 🎯 **TESTE PARA DESCOBRIR O PROBLEMA**

### **1. Recarregar Aplicação**
```
Ctrl + Shift + R
Console (F12) ABERTO e LIMPO
```

### **2. Adicionar Produto A**
```
1. Abrir produto A: /produto/xxx
2. Selecionar grade
3. Adicionar ao carrinho
4. FloatingCart abre
5. Fechar drawer (X)
6. ✅ Item está no carrinho
```

### **3. Navegar para Produto B (CRÍTICO)**
```
1. Clicar "Voltar ao Catálogo"
2. Clicar em outro produto (Produto B)
3. Página do Produto B carrega

4. ⚠️ OBSERVAR CONSOLE AGORA:
   
   Deve mostrar:
   🛒 Carregando itens do carrinho do localStorage: 1
   📋 Items do localStorage (RAW): [...]
   
   🔍 validateCartItem - Debug store_id: { ... }
   
   ⚠️ validateCartItem - [ALGUMA RAZÃO]: ...  ← PROCURE ESTE LOG!
   
   📊 Resultado da validação: [{
     isValid: false,  ← Se false, veja o log acima
     failedReason: "..."
   }]
   
   ❌ X itens REMOVIDOS: [...]

5. COPIAR TODO O CONSOLE e me enviar
```

---

## 🔍 **POSSÍVEIS CAUSAS**

### **Causa A: Preço Inválido**
```javascript
⚠️ validateCartItem - Preço inválido: NaN
ou
⚠️ validateCartItem - Preço inválido: 0
```

**Solução:** Já implementada (fallback wholesale)

---

### **Causa B: Quantity Inválido**
```javascript
⚠️ validateCartItem - Faltando id/product/quantity: {quantity: NaN}
```

**Solução:** Já corrigida (ordem de parâmetros createCartItem)

---

### **Causa C: Product.id ou Product.name Faltando**
```javascript
⚠️ validateCartItem - Faltando product.id/name: {id: undefined}
```

**Solução:** Verificar se createCartItem está criando product corretamente

---

### **Causa D: Store_id Mudou (Multi-Loja)**
```javascript
🔍 validateCartItem - Debug store_id: {
  inputStoreId: "loja-A",  ← Item é da loja A
  ...
}

// Mas produto B é de outra loja (loja-B)
// Sistema pode estar removendo itens de loja diferente
```

**Solução:** Permitir carrinho multi-loja ou avisar usuário

---

### **Causa E: Variation/GradeInfo Perdida**
```javascript
🔍 validateCartItem - Item validado: {
  hasGradeInfo: false,  ← Perdeu gradeInfo ao salvar/carregar
  gradeInfo: undefined
}
```

**Solução:** Garantir que gradeInfo é salvo no localStorage

---

## 📋 **O QUE FAZER AGORA**

### **PASSO 1: Teste com Logs**

```
1. Recarregar app (Ctrl+Shift+R)
2. Console limpo (F12)
3. Adicionar produto A
4. Navegar para produto B
5. VER CONSOLE COMPLETO
6. COPIAR E COLAR AQUI:
   
   Desde:
   🛒 Carregando itens do carrinho...
   
   Até:
   ❌ X itens REMOVIDOS...
   
   (TODO o console entre esses logs)
```

---

### **PASSO 2: Identificar Validação que Falha**

Procure no console qual log de ⚠️ aparece antes de remover:

- `⚠️ validateCartItem - Preço inválido`
- `⚠️ validateCartItem - Faltando id/product/quantity`
- `⚠️ validateCartItem - Faltando product.id/name`
- `⚠️ validateCartItem - retail_price inválido`

**Este log dirá EXATAMENTE o que está falhando!**

---

### **PASSO 3: Me Envie Console Completo**

Com o console completo, vou ver:
1. Qual validação específica está falhando
2. Quais dados estão faltando ou inválidos
3. Se é problema de serialização (localStorage)
4. Se é problema de multi-loja

E vou corrigir imediatamente!

---

## ⚡ **CORREÇÃO TEMPORÁRIA (Se Urgente)**

Enquanto não descobrimos a causa exata, você pode desabilitar temporariamente a validação restritiva:

```typescript
// src/hooks/useCart.tsx linha ~462

// COMENTAR temporariamente:
// const validItems = parsedItems
//   .map(validateCartItem)
//   .filter((item): item is CartItem => item !== null);

// USAR isto:
const validItems = parsedItems;  // ⚠️ TEMPORÁRIO - Aceita todos

// Isso vai manter todos os itens no carrinho
// MAS pode causar erros se dados realmente inválidos
```

**NÃO É SOLUÇÃO IDEAL!** Use apenas para teste.

---

## 📞 **ME ENVIE O CONSOLE**

**Faça:**
1. Recarregar
2. Adicionar produto A
3. Navegar para produto B
4. **COPIAR TODO O CONSOLE** desde "🛒 Carregando..." até "❌ removidos"
5. Colar aqui

**Com os logs, vou descobrir e corrigir imediatamente! 🔍**

