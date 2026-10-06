````markdown
# Implementação do Template Premium do Catálogo B2X

## Contexto do projeto

Você está trabalhando no frontend público do **B2X**, um SaaS de catálogos online multi-tenant.

Stack atual:

- React
- Vite
- TypeScript, caso já esteja configurado
- Tailwind CSS
- Componentes existentes do projeto
- Dados reais vindos da arquitetura atual

A imagem enviada deve ser utilizada como **referência estrutural e visual** para modernizar o template público do catálogo.

A Clara Shoes é apenas um tenant de demonstração.

O resultado precisa funcionar para empresas de diferentes segmentos, como:

- calçados;
- roupas;
- cosméticos;
- óticas;
- móveis;
- papelarias;
- farmácias;
- autopeças;
- distribuidoras;
- pet shops.

Não crie uma interface específica para calçados.

---

# Objetivo

Implementar o esqueleto visual da página inicial mostrado na referência, elevando o template atual para uma aparência:

- premium;
- profissional;
- limpa;
- confiável;
- comercial;
- moderna;
- responsiva;
- altamente personalizável por tenant.

A implementação deve reproduzir a composição, a hierarquia, o espaçamento e a experiência visual da referência, sem copiar conteúdo estático específico da Clara Shoes.

---

# Regra principal

Não reconstruir o sistema.

Não alterar:

- backend;
- APIs;
- banco de dados;
- autenticação;
- regras multi-tenant;
- gerenciamento de catálogo;
- Product Builder;
- lógica de carrinho;
- lógica de busca;
- regras de preço;
- condições de atacado;
- configurações já existentes no painel;
- contratos dos componentes;
- origem dos dados.

Faça uma refatoração real da camada de apresentação utilizando a arquitetura existente.

---

# Referência visual

Utilize a imagem fornecida como referência para:

- composição da página;
- proporção das seções;
- largura máxima do conteúdo;
- organização do header;
- distribuição do hero;
- navegação por categorias;
- visual dos cards de produto;
- seção de benefícios;
- banner institucional;
- footer;
- equilíbrio entre conteúdo e espaço em branco.

Não transforme a imagem em um HTML estático.

Não hardcode textos, produtos, imagens, cores ou informações da Clara Shoes.

---

# Direção visual

A página deve transmitir a sensação de um tema premium de e-commerce, próximo de plataformas maduras como Shopify, mas mantendo identidade própria.

Aplicar:

- fundo predominantemente claro;
- superfícies neutras;
- bordas suaves;
- sombras discretas;
- tipografia com boa hierarquia;
- uso controlado da cor principal do tenant;
- imagens de produto como protagonistas;
- componentes visualmente consistentes;
- espaçamento generoso;
- microinterações discretas.

Evitar:

- aparência de template genérico;
- aparência de interface gerada por IA;
- excesso de cards;
- excesso de badges;
- gradientes chamativos;
- sombras pesadas;
- bordas coloridas sem função;
- muitas cores concorrendo;
- emojis;
- ícones inconsistentes;
- componentes padrão do shadcn sem customização;
- conteúdo fixo da Clara Shoes.

---

# Skills e ferramentas

Utilize, caso estejam disponíveis no ambiente:

- impeccable-frontend;
- ui-ux-pro-max;
- Lucide React;
- componentes atuais do projeto;
- Motion ou Framer Motion apenas para microinterações discretas.

Não adicione bibliotecas desnecessárias.

Antes de instalar qualquer dependência, confirme se o projeto já possui solução equivalente.

---

# Design System e multi-tenant

O template deve consumir tokens semânticos.

Não use cores de marca fixas diretamente nos componentes.

Evite:

```tsx
bg-amber-950
text-orange-600
border-yellow-300
bg-blue-600
````

Prefira classes ou variáveis semânticas:

```tsx
bg-background
bg-surface
bg-surface-muted
text-foreground
text-muted-foreground
bg-primary
text-primary-foreground
border-border
```

Caso o projeto ainda não possua tokens suficientes, organize variáveis como:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 24 30% 12%;

  --surface: 30 30% 99%;
  --surface-muted: 30 24% 96%;

  --primary: 24 58% 18%;
  --primary-foreground: 30 40% 98%;

  --secondary: 30 28% 93%;
  --secondary-foreground: 24 32% 16%;

  --muted: 30 18% 94%;
  --muted-foreground: 24 10% 42%;

  --border: 30 18% 88%;
  --success: 142 45% 40%;
  --warning: 36 85% 48%;
  --danger: 0 70% 52%;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
}
```

A cor principal deve ser injetada ou sobrescrita pelas configurações do tenant.

---

# Container principal

Criar uma largura máxima consistente para toda a página.

Referência:

```tsx
max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8
```

Em telas grandes, o conteúdo não deve ficar excessivamente esticado.

Manter alinhamento horizontal entre:

* header;
* hero;
* categorias;
* produtos;
* benefícios;
* banner institucional;
* footer.

---

# Esqueleto da página

A página deve seguir esta ordem:

```text
AnnouncementBar
Header
MainNavigation
HeroSection
CategoryShortcutSection
FeaturedProductsSection
BenefitsStrip
InstitutionalBanner
Footer
CopyrightBar
```

Cada seção deve ser um componente reutilizável.

---

# 1. Announcement Bar

Criar uma barra fina no topo.

Estrutura desktop:

```text
[Benefício comercial]                         [Atendimento/WhatsApp]
```

Exemplos de conteúdo dinâmico:

* frete grátis;
* pedido mínimo;
* horário de atendimento;
* WhatsApp;
* aviso promocional.

Requisitos:

* altura aproximada entre 32px e 40px;
* fundo derivado da cor primária;
* texto pequeno;
* bom contraste;
* ícones Lucide;
* conteúdo centralizado no mesmo container da página;
* ocultar ou simplificar informações secundárias no mobile;
* não usar emojis.

Componente sugerido:

```text
AnnouncementBar
```

---

# 2. Header principal

Estrutura desktop:

```text
[Logo do tenant]   [Campo de busca amplo]   [Minha conta]   [Carrinho]
```

Requisitos:

* altura aproximada entre 76px e 92px;
* logo alinhada à esquerda;
* busca ocupando a maior parte da região central;
* ações à direita;
* borda inferior discreta;
* fundo claro;
* ícones Lucide;
* estados hover e focus;
* contador do carrinho;
* suporte a nome e logo configuráveis pelo tenant.

Comportamento responsivo:

## Desktop

Mostrar:

* logo;
* busca completa;
* conta;
* carrinho.

## Tablet

Reduzir textos secundários e preservar os ícones.

## Mobile

Organizar em duas linhas ou utilizar:

```text
[Menu] [Logo] [Carrinho]
[Busca em largura total]
```

Não comprometer a busca no mobile.

Componentes sugeridos:

```text
StoreHeader
StoreLogo
CatalogSearch
HeaderAction
CartButton
```

---

# 3. Navegação principal

Criar uma barra separada abaixo do header.

Estrutura:

```text
[Menu/Categorias] [Início] [Novidades] [Categorias configuradas] [Ofertas] [Contato]
```

Requisitos:

* alinhamento horizontal;
* altura aproximada entre 48px e 56px;
* borda inferior sutil;
* item ativo discreto;
* dropdown de categorias, caso já exista;
* navegação alimentada pelas configurações do tenant;
* scroll horizontal no mobile;
* não quebrar em múltiplas linhas;
* não hardcode categorias da Clara Shoes.

Componente sugerido:

```text
MainNavigation
CategoryDropdown
NavigationItem
```

---

# 4. Hero principal

Reproduzir a composição da referência:

```text
┌──────────────────────────────────────────────┐
│                                              │
│  Eyebrow                                     │
│  Título principal        Imagem promocional  │
│  Texto de apoio                              │
│  CTA                                         │
│                                              │
│                 Indicadores                  │
└──────────────────────────────────────────────┘
```

Requisitos:

* largura total dentro do container;
* proporção panorâmica;
* altura visual aproximada entre 380px e 460px no desktop;
* raio grande, porém elegante;
* overflow hidden;
* conteúdo textual posicionado à esquerda;
* imagem ocupando a área direita;
* overlay apenas quando necessário para legibilidade;
* CTA visível;
* indicadores discretos do carrossel;
* suporte a múltiplos banners, caso já exista;
* respeitar configurações do tenant;
* imagem com `object-cover`;
* tratamento para carregamento e imagem ausente.

Direção do texto:

```text
Eyebrow pequeno
Título em duas ou três linhas
Descrição curta
CTA principal
```

Tipografia aproximada:

```text
Eyebrow: 12–14px
Título: 42–58px
Descrição: 16–20px
CTA: 14–16px
```

Mobile:

* reduzir altura;
* título entre 30px e 38px;
* garantir contraste;
* permitir imagem como background ou composição vertical;
* evitar cortar o produto principal;
* CTA fácil de tocar.

Componentes sugeridos:

```text
HeroSection
HeroSlide
HeroContent
HeroMedia
HeroPagination
```

---

# 5. Atalhos de categorias

Abaixo do hero, criar uma faixa de categorias em pequenos cards.

Estrutura desktop:

```text
[Categoria] [Categoria] [Categoria] [Categoria] [Categoria] [Ofertas] [Novidades]
```

Cada item deve conter:

* ícone ou imagem;
* nome;
* estado hover;
* ação de navegação.

Requisitos:

* visual leve;
* cards quase quadrados;
* borda neutra;
* fundo claro;
* ícones lineares;
* altura consistente;
* sem sombras pesadas;
* sem emojis;
* scroll horizontal no mobile;
* categorias vindas dos dados existentes;
* fallback quando não houver imagem ou ícone.

Dimensão aproximada:

```text
Desktop: 132px × 112px
Mobile: 96px × 88px
```

Componentes sugeridos:

```text
CategoryShortcutSection
CategoryShortcutCard
```

---

# 6. Produtos em destaque

Cabeçalho da seção:

```text
Produtos em destaque                         Ver todos →
```

Requisitos:

* título forte;
* link discreto;
* alinhamento consistente;
* carrossel ou grid conforme comportamento atual;
* 4 a 5 produtos visíveis no desktop;
* 2 produtos no tablet;
* aproximadamente 1,2 produto no mobile para indicar scroll.

Estrutura do card:

```text
┌─────────────────────────┐
│ Badge opcional      ♡   │
│                         │
│      Imagem grande      │
│                         │
├─────────────────────────┤
│ Nome do produto         │
│ Avaliação opcional      │
│ Preço                   │
│ Condição atacado        │
│ Botão / ação            │
└─────────────────────────┘
```

Requisitos do card:

* imagem ocupando aproximadamente 55% a 62% da altura;
* proporção consistente;
* fundo neutro para a foto;
* título limitado a duas linhas;
* preço com hierarquia;
* atacado como informação secundária;
* botão discreto;
* badge pequena;
* favorito no canto superior;
* hover elegante;
* zoom leve da imagem;
* sombra mínima;
* borda neutra;
* raio consistente;
* não usar diversas cores fortes.

Não adicionar avaliações falsas.

Mostrar avaliações apenas quando existirem dados reais.

Não adicionar favoritos caso a funcionalidade não exista.

Quando uma ação visual não tiver funcionalidade real, omitir o elemento.

Componentes sugeridos:

```text
FeaturedProductsSection
SectionHeading
ProductCarousel
ProductCard
ProductImage
ProductPrice
WholesalePrice
ProductCardAction
```

---

# 7. Faixa de benefícios

Criar uma faixa horizontal com benefícios comerciais.

Estrutura da referência:

```text
[Ícone] Parcele suas compras
        em até 12x

[Ícone] Frete rápido e seguro
        para todo o Brasil

[Ícone] Produtos originais
        com garantia
```

Os dados devem ser configuráveis.

Possíveis itens:

* parcelamento;
* entrega;
* compra segura;
* garantia;
* atendimento;
* devolução.

Requisitos:

* uma única superfície;
* borda discreta;
* fundo claro;
* três ou quatro colunas;
* ícones Lucide;
* sem emojis;
* sem cores diferentes para cada item;
* layout vertical no mobile;
* textos curtos.

Componente sugerido:

```text
BenefitsStrip
BenefitItem
```

---

# 8. Banner institucional secundário

Criar uma seção panorâmica abaixo dos benefícios.

Estrutura:

```text
┌──────────────────────────────────────────────┐
│ Título                  Imagem institucional │
│ Texto                                        │
│ CTA                                          │
└──────────────────────────────────────────────┘
```

Objetivo:

* quebrar a repetição da grade de produtos;
* destacar campanha;
* apresentar coleção;
* comunicar posicionamento da marca;
* aumentar percepção premium.

Requisitos:

* altura aproximada entre 240px e 320px;
* imagem com boa composição;
* texto curto;
* CTA;
* raio grande;
* fundo neutro;
* comportamento configurável;
* adaptação mobile;
* sem conteúdo fixo da Clara Shoes.

Componente sugerido:

```text
InstitutionalBanner
```

---

# 9. Footer

Criar footer amplo, limpo e organizado.

Estrutura desktop sugerida:

```text
[Marca]        [Links rápidos]   [Atendimento]   [Informações]   [Pagamentos]
Descrição      Sobre nós         Telefone        Privacidade     Logos
Redes sociais  Produtos          E-mail          Termos
               Novidades         Horário         Trocas
               Contato           Endereço        Entrega
```

Requisitos:

* fundo claro ou superfície levemente distinta;
* divisor superior;
* espaçamento generoso;
* títulos pequenos e fortes;
* links discretos;
* ícones Lucide para contato;
* redes sociais configuráveis;
* informações reais do tenant;
* formas de pagamento apenas quando configuradas;
* não hardcode endereço, telefone ou e-mail;
* organizar colunas responsivamente;
* usar accordions no mobile, caso isso melhore a leitura.

Componentes sugeridos:

```text
StoreFooter
FooterBrand
FooterColumn
FooterContact
FooterPayments
SocialLinks
```

---

# 10. Barra inferior

Criar uma faixa final contendo:

```text
© Ano Nome da empresa. Todos os direitos reservados.

Desenvolvido por B2X
```

Requisitos:

* texto pequeno;
* fundo muito sutil;
* conteúdo configurável;
* ano dinâmico;
* marca B2X discreta;
* alinhamento responsivo.

Não usar emoji de coração.

---

# Componentização sugerida

Organize os componentes de forma semelhante a:

```text
src/
├── components/
│   ├── storefront/
│   │   ├── announcement-bar.tsx
│   │   ├── store-header.tsx
│   │   ├── catalog-search.tsx
│   │   ├── main-navigation.tsx
│   │   ├── hero-section.tsx
│   │   ├── category-shortcuts.tsx
│   │   ├── featured-products.tsx
│   │   ├── product-card.tsx
│   │   ├── benefits-strip.tsx
│   │   ├── institutional-banner.tsx
│   │   ├── store-footer.tsx
│   │   └── copyright-bar.tsx
│   └── ui/
├── pages/
│   └── catalog/
├── hooks/
├── lib/
├── types/
└── styles/
```

Adapte essa sugestão à organização já existente.

Não mova arquivos sem necessidade.

Não crie duplicação de componentes já disponíveis.

---

# Tipografia

Utilize a fonte já configurada pelo tenant ou pelo sistema.

Caso existam opções de fonte no tema, preserve-as.

Escala recomendada:

```text
Hero title: 42–58px
Section title: 26–34px
Product title: 14–17px
Product price: 20–26px
Body: 14–17px
Small text: 12–13px
Button: 14–16px
```

No mobile, use `clamp()` ou classes responsivas.

Evite excesso de `font-bold`.

Crie contraste por:

* tamanho;
* peso;
* cor;
* espaçamento.

---

# Espaçamento

Utilize uma escala previsível:

```text
4px
8px
12px
16px
24px
32px
48px
64px
80px
```

Espaçamento aproximado entre seções:

```text
Desktop: 48px a 72px
Mobile: 32px a 48px
```

Evite espaços vazios sem intenção.

---

# Bordas e sombras

Utilizar:

```text
border: 1px neutra
shadow-sm ou sombra customizada suave
radius: 12px a 20px
```

Não utilizar:

* sombra cinza pesada;
* glow;
* borda dupla;
* borda colorida sem função;
* radius excessivamente arredondado em todos os componentes.

---

# Ícones

Utilizar Lucide React.

Sugestões:

```text
Truck
Search
UserRound
ShoppingBag
Menu
ChevronDown
ChevronRight
Heart
Tag
ShieldCheck
CreditCard
PackageCheck
Phone
Mail
MapPin
Clock
Instagram
Facebook
ArrowRight
```

Não utilizar emojis em nenhuma parte da interface.

---

# Interações

Adicionar microinterações discretas:

* hover de links;
* hover de cards;
* zoom leve de imagem;
* feedback de seleção;
* transição dos menus;
* mudança de estado do botão;
* skeleton de carregamento;
* animação curta no carrossel.

Duração:

```text
150ms a 250ms
```

Respeitar:

```css
prefers-reduced-motion
```

Não criar animações chamativas.

---

# Estados obrigatórios

Tratar corretamente:

* loading;
* erro;
* vazio;
* imagem indisponível;
* catálogo sem banner;
* catálogo sem categorias;
* catálogo sem produtos em destaque;
* catálogo sem benefícios;
* tenant sem redes sociais;
* tenant sem formas de pagamento;
* título longo;
* logo horizontal;
* logo quadrada;
* imagem clara;
* imagem escura;
* cor primária clara;
* cor primária escura.

Quando uma seção não possuir dados, não deixar espaço vazio artificial.

---

# Responsividade

## Desktop

* container centralizado;
* hero panorâmico;
* header em uma linha;
* cinco cards de produto quando houver espaço;
* footer em múltiplas colunas.

## Tablet

* reduzir número de produtos visíveis;
* simplificar ações do header;
* manter hero equilibrado;
* evitar compressão excessiva.

## Mobile

Ordem sugerida:

```text
Announcement
Header compacto
Busca
Navegação horizontal
Hero
Categorias horizontais
Produtos
Benefícios empilhados
Banner institucional
Footer
```

Requisitos mobile:

* alvos de toque com no mínimo 44px;
* cards de produto legíveis;
* busca em largura total;
* miniaturas e listas com scroll horizontal suave;
* sem overflow lateral da página;
* tipografia adaptada;
* imagens otimizadas;
* footer organizado.

---

# Performance

Garantir:

* lazy loading de imagens fora da primeira dobra;
* definição de proporção para evitar layout shift;
* `loading="lazy"` quando aplicável;
* tamanhos responsivos;
* componentes sem re-renderizações desnecessárias;
* nenhuma dependência pesada apenas para efeitos simples;
* carrossel existente reutilizado, quando adequado;
* imagens otimizadas pela infraestrutura atual.

Não introduzir regressões de Core Web Vitals.

---

# Acessibilidade

Garantir:

* contraste WCAG AA;
* foco visível;
* navegação por teclado;
* labels de busca;
* alt text das imagens;
* nomes acessíveis nos botões de ícone;
* hierarquia semântica de headings;
* links e botões semanticamente corretos;
* navegação acessível;
* estados disabled;
* suporte a leitores de tela.

Não utilizar `div` clicável quando deveria ser `button` ou `a`.

---

# Processo obrigatório

## Etapa 1 — Auditoria

Antes de codificar:

1. analise a estrutura atual da página;
2. identifique os componentes existentes;
3. identifique os dados recebidos;
4. identifique os tokens do tenant;
5. identifique as configurações que controlam cada seção;
6. identifique os componentes que podem ser reutilizados;
7. identifique estilos duplicados;
8. identifique riscos de regressão.

Apresente um plano curto com:

* arquivos que serão alterados;
* componentes que serão reutilizados;
* componentes que serão criados;
* riscos identificados.

Não fique aguardando aprovação, salvo se encontrar uma decisão estrutural realmente bloqueadora.

## Etapa 2 — Implementação

Implemente na seguinte prioridade:

1. tokens e estrutura global;
2. container;
3. announcement bar;
4. header;
5. navegação;
6. hero;
7. categorias;
8. cards de produto;
9. benefícios;
10. banner institucional;
11. footer;
12. responsividade;
13. loading e estados vazios;
14. acessibilidade;
15. microinterações.

## Etapa 3 — Validação

Execute:

* lint;
* typecheck;
* build;
* testes existentes;
* validação visual desktop;
* validação visual tablet;
* validação visual mobile.

Corrija os erros encontrados antes de concluir.

---

# Critérios de aceite

A tarefa estará concluída quando:

* a página seguir claramente o esqueleto da referência;
* o resultado tiver aparência premium;
* o template continuar multi-tenant;
* nenhuma informação da Clara Shoes estiver hardcoded;
* cores vierem dos tokens do tenant;
* emojis tiverem sido removidos;
* header, hero, categorias, produtos, benefícios, banner e footer estiverem visualmente consistentes;
* a experiência mobile estiver refinada;
* componentes forem reutilizáveis;
* funcionalidades atuais continuarem funcionando;
* não houver alteração de backend;
* não houver regressão no carrinho;
* não houver regressão na busca;
* não houver regressão na navegação;
* build, lint e typecheck passarem;
* o código estiver pronto para produção.

---

# Resultado esperado

Entregue uma implementação real em React, Vite e Tailwind, baseada na referência fornecida, preservando integralmente a arquitetura e os dados existentes.

Não entregue apenas sugestões.

Não entregue mockup isolado.

Não substitua dados reais por mocks.

Não use a Clara Shoes como regra de negócio.

Implemente um template base premium, reutilizável e seguro para todos os tenants do B2X.

```
```
