# ⚡ Quick Start - Deploy Nginx no Easypanel

## 🚀 Deploy em 5 Passos

### 1️⃣ Validar Build Localmente (Opcional)

**Linux/Mac:**
```bash
bash docker-test.sh
```

**Windows (PowerShell):**
```powershell
.\docker-test.ps1
```

Ou manualmente:
```bash
docker build -t vendemais-nginx .
docker run -p 8080:80 vendemais-nginx
# Acesse http://localhost:8080
```

---

### 2️⃣ Commit e Push para GitHub

```bash
git add Dockerfile nginx.conf .dockerignore
git commit -m "feat: migrar para Nginx para melhor performance"
git push origin main
```

---

### 3️⃣ Configurar Easypanel

1. Acesse o **Easypanel**
2. Vá para o projeto **VendeMais**
3. Clique em **Settings** → **General**

**Configurações:**
- **Type:** `Dockerfile`
- **Repository:** `seu-usuario/VendeMais`
- **Branch:** `main`
- **Dockerfile Path:** `Dockerfile`

---

### 4️⃣ Configurar Porta

Em **Settings** → **Networking**:

- **Container Port:** `80`
- **Protocol:** `HTTP`
- **Public:** ✅ Enabled

---

### 5️⃣ Adicionar Variáveis de Ambiente

Em **Settings** → **Environment**:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```

> ⚠️ **Importante:** Estas variáveis são necessárias para o build do Vite!

---

### 6️⃣ Deploy!

1. Clique em **Deploy** ou **Rebuild**
2. Acompanhe os logs
3. Aguarde finalização (geralmente 2-5 minutos)
4. Acesse a URL fornecida pelo Easypanel

---

## ✅ Checklist de Validação Pós-Deploy

- [ ] Site acessível via URL do Easypanel
- [ ] Página inicial carrega corretamente
- [ ] Navegação entre rotas funciona
- [ ] Recarregar página em rota específica não dá 404
- [ ] Console do navegador sem erros
- [ ] Integração Supabase funcionando (login, dados, etc.)
- [ ] Performance melhorada (verificar Network tab no DevTools)

---

## 🔍 Verificar Performance

Abra o **DevTools** (F12) → **Network**:

1. **Recarregar página** (Ctrl+R)
2. Verificar:
   - ✅ Arquivos `.js` e `.css` com header `Cache-Control: public, immutable`
   - ✅ Tamanho de arquivos reduzido (gzip ativo)
   - ✅ Tempo de carregamento < 2s (primeira visita)

---

## 🐛 Troubleshooting Rápido

### Build falha no Easypanel

**Erro:** `npm ci failed`
- ✅ Verifique se `package.json` e `package-lock.json` estão commitados
- ✅ Verifique logs completos do build

**Erro:** `COPY failed: no such file or directory`
- ✅ Verifique se `npm run build` gera a pasta `dist/`
- ✅ Teste o build localmente: `npm ci && npm run build && ls dist/`

---

### Site não carrega após deploy

**Sintoma:** Página em branco ou erro 502
- ✅ Verifique se a porta `80` está configurada no Easypanel
- ✅ Verifique logs do container: `docker logs <container-id>`
- ✅ Verifique se o Nginx iniciou corretamente

---

### Rotas retornam 404

**Sintoma:** Ao recarregar `/produtos`, retorna 404
- ✅ Verifique se `nginx.conf` foi copiado corretamente
- ✅ No container, execute: `cat /etc/nginx/conf.d/default.conf`
- ✅ Deve conter: `try_files $uri $uri/ /index.html;`

---

### Supabase não conecta

**Sintoma:** Erros de autenticação ou API
- ✅ Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
- ✅ Variáveis devem estar definidas **antes do build**
- ✅ Rebuild necessário após adicionar variáveis

---

## 📊 Comparação Esperada

| Métrica | Antes (Node) | Depois (Nginx) |
|---------|--------------|----------------|
| Primeiro carregamento | 2-5s | 0.5-1.5s |
| Carregamento subsequente | 1-3s | 0.1-0.5s |
| Tamanho de arquivos JS | ~500KB | ~200KB (gzip) |
| Uso de memória (container) | ~80MB | ~10MB |

---

## 🎯 Próximos Passos (Opcional)

### Configurar CDN (Cloudflare)

1. Adicionar domínio no Cloudflare
2. Apontar DNS para Easypanel
3. Habilitar cache automático
4. **Resultado:** Carregamento global < 500ms

### Monitoramento

- **Google Analytics:** Verificar tempo de carregamento
- **Lighthouse:** Score esperado > 90
- **GTmetrix:** Grade A esperada

### Otimizações Futuras

- [ ] Lazy loading de imagens
- [ ] Code splitting adicional
- [ ] Preload de fontes
- [ ] Service Worker (PWA)

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique logs do Easypanel
2. Teste build localmente com Docker
3. Consulte `MIGRACAO_NGINX.md` para detalhes técnicos
4. Verifique documentação do Easypanel

---

**Migração criada com sucesso! 🎉**

