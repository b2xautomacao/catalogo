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

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para o build)
RUN npm ci && \
    npm cache clean --force

# Copiar código-fonte
COPY . .

# Build de produção
RUN npm run build

# Etapa 2: Servir com Nginx
FROM nginx:1.25-alpine

# Copiar build do Vite para o diretório do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Verificar configuração e iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

