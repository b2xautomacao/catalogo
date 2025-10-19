# Script de validação do build Nginx (PowerShell)
# Execute: .\docker-test.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando validação do build Nginx..." -ForegroundColor Cyan
Write-Host ""

$IMAGE_NAME = "vendemais-nginx"
$CONTAINER_NAME = "vendemais-test"
$PORT = 8080

# Função para cleanup
function Cleanup {
    Write-Host ""
    Write-Host "🧹 Limpando containers e imagens de teste..." -ForegroundColor Yellow
    docker stop $CONTAINER_NAME 2>$null
    docker rm $CONTAINER_NAME 2>$null
}

# Cleanup no início
Cleanup

try {
    Write-Host "📦 Passo 1: Building imagem Docker..." -ForegroundColor Cyan
    docker build -t $IMAGE_NAME .
    if ($LASTEXITCODE -ne 0) {
        throw "Erro no build da imagem"
    }
    Write-Host "✅ Imagem criada com sucesso" -ForegroundColor Green
    Write-Host ""

    Write-Host "🔍 Passo 2: Verificando tamanho da imagem..." -ForegroundColor Cyan
    $IMAGE_SIZE = docker images $IMAGE_NAME --format "{{.Size}}"
    Write-Host "   Tamanho: $IMAGE_SIZE" -ForegroundColor White
    Write-Host "✅ Imagem otimizada" -ForegroundColor Green
    Write-Host ""

    Write-Host "🚢 Passo 3: Iniciando container na porta $PORT..." -ForegroundColor Cyan
    docker run -d --name $CONTAINER_NAME -p "${PORT}:80" $IMAGE_NAME
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao iniciar container"
    }
    Write-Host "✅ Container iniciado" -ForegroundColor Green
    Write-Host ""

    Write-Host "⏳ Aguardando Nginx inicializar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    Write-Host "🧪 Passo 4: Executando testes..." -ForegroundColor Cyan
    Write-Host ""

    # Teste 1: Verificar se o servidor está respondendo
    Write-Host "   Teste 1: Servidor respondendo..." -ForegroundColor White
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Servidor OK (HTTP $($response.StatusCode))" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ Servidor não está respondendo" -ForegroundColor Red
        throw
    }

    # Teste 2: Verificar compressão gzip
    Write-Host "   Teste 2: Compressão gzip..." -ForegroundColor White
    try {
        $headers = @{"Accept-Encoding" = "gzip"}
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT" -Headers $headers -Method Head -UseBasicParsing
        if ($response.Headers["Content-Encoding"] -contains "gzip") {
            Write-Host "   ✅ Gzip habilitado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Gzip pode não estar ativo (verifique assets JS/CSS)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Não foi possível verificar gzip" -ForegroundColor Yellow
    }

    # Teste 3: Verificar arquivos essenciais
    Write-Host "   Teste 3: Arquivos essenciais..." -ForegroundColor White
    $indexExists = docker exec $CONTAINER_NAME test -f /usr/share/nginx/html/index.html
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ index.html encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ index.html não encontrado" -ForegroundColor Red
        throw "Arquivo index.html não encontrado"
    }

    # Teste 4: Verificar configuração Nginx
    Write-Host "   Teste 4: Configuração Nginx..." -ForegroundColor White
    $nginxTest = docker exec $CONTAINER_NAME nginx -t 2>&1
    if ($nginxTest -match "successful") {
        Write-Host "   ✅ Configuração Nginx válida" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Configuração Nginx inválida" -ForegroundColor Red
        throw "Configuração Nginx inválida"
    }

    Write-Host ""
    Write-Host "🎉 Todos os testes passaram!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Informações do container:" -ForegroundColor Cyan
    Write-Host "   Container: $CONTAINER_NAME" -ForegroundColor White
    Write-Host "   Imagem: $IMAGE_NAME ($IMAGE_SIZE)" -ForegroundColor White
    Write-Host "   URL: http://localhost:$PORT" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Acesse http://localhost:$PORT no navegador para testar manualmente." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para ver logs do Nginx:" -ForegroundColor Yellow
    Write-Host "   docker logs $CONTAINER_NAME" -ForegroundColor White
    Write-Host ""
    Write-Host "Para parar e remover o container de teste:" -ForegroundColor Yellow
    Write-Host "   docker stop $CONTAINER_NAME; docker rm $CONTAINER_NAME" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Lembre-se de adicionar variáveis de ambiente do Vite no Easypanel!" -ForegroundColor Yellow

} catch {
    Write-Host ""
    Write-Host "❌ Erro durante a validação: $_" -ForegroundColor Red
    Cleanup
    exit 1
}

