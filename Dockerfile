# Etapa 1: Build da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

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

