#!/bin/bash

# Script de validação do build Nginx
# Execute: bash docker-test.sh

set -e

echo "🚀 Iniciando validação do build Nginx..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

IMAGE_NAME="vendemais-nginx"
CONTAINER_NAME="vendemais-test"
PORT=8080

# Função para cleanup
cleanup() {
    echo ""
    echo "${YELLOW}🧹 Limpando containers e imagens de teste...${NC}"
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Cleanup no início
cleanup

echo "📦 Passo 1: Building imagem Docker..."
docker build -t $IMAGE_NAME . || {
    echo "${RED}❌ Erro no build da imagem${NC}"
    exit 1
}
echo "${GREEN}✅ Imagem criada com sucesso${NC}"
echo ""

echo "🔍 Passo 2: Verificando tamanho da imagem..."
IMAGE_SIZE=$(docker images $IMAGE_NAME --format "{{.Size}}")
echo "   Tamanho: $IMAGE_SIZE"
echo "${GREEN}✅ Imagem otimizada${NC}"
echo ""

echo "🚢 Passo 3: Iniciando container na porta $PORT..."
docker run -d --name $CONTAINER_NAME -p $PORT:80 $IMAGE_NAME || {
    echo "${RED}❌ Erro ao iniciar container${NC}"
    cleanup
    exit 1
}
echo "${GREEN}✅ Container iniciado${NC}"
echo ""

# Aguardar Nginx iniciar
echo "⏳ Aguardando Nginx inicializar..."
sleep 3

echo "🧪 Passo 4: Executando testes..."
echo ""

# Teste 1: Verificar se o servidor está respondendo
echo "   Teste 1: Servidor respondendo..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "${GREEN}   ✅ Servidor OK (HTTP $HTTP_CODE)${NC}"
else
    echo "${RED}   ❌ Servidor retornou HTTP $HTTP_CODE${NC}"
    cleanup
    exit 1
fi

# Teste 2: Verificar compressão gzip
echo "   Teste 2: Compressão gzip..."
GZIP_HEADER=$(curl -s -H "Accept-Encoding: gzip" -I http://localhost:$PORT | grep -i "content-encoding: gzip" || echo "")
if [ -n "$GZIP_HEADER" ]; then
    echo "${GREEN}   ✅ Gzip habilitado${NC}"
else
    echo "${YELLOW}   ⚠️  Gzip pode não estar ativo (verifique assets JS/CSS)${NC}"
fi

# Teste 3: Verificar cache headers em assets
echo "   Teste 3: Cache headers..."
# Buscar um arquivo JS de exemplo
ASSET_FILE=$(docker exec $CONTAINER_NAME find /usr/share/nginx/html/assets -name "*.js" -type f | head -n 1 || echo "")
if [ -n "$ASSET_FILE" ]; then
    ASSET_PATH=$(echo $ASSET_FILE | sed 's|/usr/share/nginx/html||')
    CACHE_HEADER=$(curl -s -I "http://localhost:$PORT$ASSET_PATH" | grep -i "cache-control" || echo "")
    if [[ $CACHE_HEADER == *"immutable"* ]]; then
        echo "${GREEN}   ✅ Cache configurado corretamente${NC}"
    else
        echo "${YELLOW}   ⚠️  Cache header não encontrado${NC}"
    fi
fi

# Teste 4: Verificar arquivos essenciais
echo "   Teste 4: Arquivos essenciais..."
docker exec $CONTAINER_NAME test -f /usr/share/nginx/html/index.html && {
    echo "${GREEN}   ✅ index.html encontrado${NC}"
} || {
    echo "${RED}   ❌ index.html não encontrado${NC}"
    cleanup
    exit 1
}

# Teste 5: Verificar configuração Nginx
echo "   Teste 5: Configuração Nginx..."
docker exec $CONTAINER_NAME nginx -t 2>&1 | grep -q "successful" && {
    echo "${GREEN}   ✅ Configuração Nginx válida${NC}"
} || {
    echo "${RED}   ❌ Configuração Nginx inválida${NC}"
    cleanup
    exit 1
}

echo ""
echo "${GREEN}🎉 Todos os testes passaram!${NC}"
echo ""
echo "📊 Informações do container:"
echo "   Container: $CONTAINER_NAME"
echo "   Imagem: $IMAGE_NAME ($IMAGE_SIZE)"
echo "   URL: http://localhost:$PORT"
echo ""
echo "🌐 Acesse http://localhost:$PORT no navegador para testar manualmente."
echo ""
echo "Para ver logs do Nginx:"
echo "   docker logs $CONTAINER_NAME"
echo ""
echo "Para parar e remover o container de teste:"
echo "   docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
echo ""
echo "${YELLOW}💡 Lembre-se de adicionar variáveis de ambiente do Vite no Easypanel!${NC}"

