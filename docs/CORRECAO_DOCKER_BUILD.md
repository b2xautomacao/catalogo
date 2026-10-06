# 🔧 CORREÇÃO - Erro de Build Docker

## ❌ Problema

```
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" 
did not complete successfully: exit code: 2
```

## 🔍 Causa

O Dockerfile não estava recebendo as variáveis de ambiente (`VITE_*`) como ARG e passando para o processo de build do Vite.

O Vite precisa das variáveis `VITE_*` no momento do build para injetá-las no código.

## ✅ Solução Aplicada

Atualizado o `Dockerfile` para:

1. **Receber variáveis como ARG:**
```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_AI_SERVER_URL
```

2. **Converter para ENV para o Vite usar:**
```dockerfile
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV VITE_AI_SERVER_URL=$VITE_AI_SERVER_URL
```

## 📝 Dockerfile Atualizado

```dockerfile
# Etapa 1: Build da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# 🔴 CORREÇÃO: Receber variáveis de ambiente como ARG
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_AI_SERVER_URL

# 🔴 CORREÇÃO: Definir como ENV para o Vite usar durante o build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV VITE_AI_SERVER_URL=$VITE_AI_SERVER_URL

# ... resto do Dockerfile
```

## ✅ Como Testar

1. **Build local (teste):**
```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://uytkhyqwikdpplwsesoz.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGci... \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci... \
  --build-arg VITE_SUPABASE_PROJECT_ID=uytkhyqwikdpplwsesoz \
  --build-arg VITE_AI_SERVER_URL=http://localhost:3001 \
  -t catalogo-test .
```

2. **No Easypanel:**
   - As variáveis já estão configuradas como `--build-arg`
   - O build deve funcionar automaticamente agora

## 🔍 Verificação

Se ainda houver erro, verifique:

1. **Logs do build:** Procure por erros de TypeScript ou Vite
2. **Variáveis de ambiente:** Confirme que todas as `VITE_*` estão sendo passadas
3. **Cache do Docker:** Tente `docker build --no-cache`

## 📚 Referências

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker ARG vs ENV](https://docs.docker.com/engine/reference/builder/#arg)
