# 🔐 Variáveis de Ambiente - VendeMais

## 📋 Visão Geral

Este documento lista todas as variáveis de ambiente necessárias para o **build** e **execução** do frontend VendeMais com Nginx.

---

## 🎯 Variáveis Obrigatórias

### Supabase

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```

**Onde encontrar:**
1. Acesse o dashboard do Supabase
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 🔧 Configuração por Ambiente

### Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto:

```bash
# .env (local)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```

**Executar:**
```bash
npm run dev
# Acesse http://localhost:8080
```

---

### Produção (Easypanel)

1. Acesse o **Easypanel**
2. Vá para o projeto **VendeMais**
3. Clique em **Settings** → **Environment**
4. Adicione as variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```

5. Clique em **Save**
6. Faça **Rebuild** do container

> ⚠️ **Importante:** Após adicionar/modificar variáveis, é necessário fazer **rebuild**!

---

### Build Local (Docker)

Para testar o build Docker com variáveis de ambiente:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://seu-projeto.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=sua_chave_anon \
  -t vendemais-nginx .

docker run -p 8080:80 vendemais-nginx
```

---

## 🛡️ Segurança

### ✅ O que PODE ser exposto (VITE_*)

- URLs públicas (Supabase URL)
- Chaves públicas (anon key)
- IDs de projetos
- URLs de APIs públicas

### ❌ O que NUNCA deve ser exposto

- **Service Role Key** do Supabase
- Senhas ou secrets
- Tokens de admin
- Chaves privadas de API

> 💡 **Dica:** Todas as variáveis com prefixo `VITE_` são **injetadas no código frontend** e podem ser vistas por qualquer usuário. Use apenas valores públicos!

---

## 🔍 Verificar Variáveis no Build

### Durante o desenvolvimento

Abra o console do navegador (F12) e digite:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

Deve retornar os valores configurados.

---

### No build de produção

As variáveis são substituídas em **tempo de build** e não podem ser alteradas depois sem rebuild.

Para verificar:
1. Faça o build: `npm run build`
2. Abra `dist/assets/js/index-*.js`
3. Procure pela URL do Supabase (ela estará hardcoded)

---

## 📝 Variáveis Opcionais

### Customizações

```bash
# URL base da aplicação (se necessário)
VITE_APP_URL=https://vendemais.com.br

# Modo de debug (development only)
VITE_DEBUG=true

# Analytics (se implementado)
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

> 💡 Adicione apenas se necessário para seu ambiente específico.

---

## 🐛 Troubleshooting

### Erro: "supabaseUrl is required"

**Causa:** Variável `VITE_SUPABASE_URL` não foi definida ou não foi injetada no build.

**Solução:**
1. Verifique se a variável está definida no Easypanel
2. Faça rebuild do container
3. Verifique se não há erros de sintaxe no nome da variável

---

### Erro: "Invalid API key"

**Causa:** Variável `VITE_SUPABASE_ANON_KEY` incorreta ou expirada.

**Solução:**
1. Acesse o dashboard do Supabase
2. Vá em **Settings** → **API**
3. Copie novamente a **anon public key**
4. Atualize no Easypanel
5. Faça rebuild

---

### Variáveis não estão sendo carregadas

**Causa:** Variáveis definidas **após** o build ou sem prefixo `VITE_`.

**Solução:**
1. Certifique-se de que todas as variáveis têm prefixo `VITE_`
2. Defina as variáveis **antes** do build
3. No Easypanel, sempre faça **rebuild** após alterar variáveis
4. Variáveis definidas sem `VITE_` não são expostas no frontend

---

## 📚 Referências

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-keys)
- [Easypanel Environment Variables](https://easypanel.io/docs)

---

## ✅ Checklist de Configuração

- [ ] `VITE_SUPABASE_URL` definida
- [ ] `VITE_SUPABASE_ANON_KEY` definida
- [ ] Variáveis adicionadas no Easypanel (produção)
- [ ] Rebuild executado após adicionar variáveis
- [ ] Site testado e autenticação funcionando
- [ ] Nenhuma variável secreta exposta no código

---

**Última atualização:** Migração para Nginx

