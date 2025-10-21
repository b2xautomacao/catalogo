// Cole este código no Console do navegador para filtrar apenas logs de variações
// Cole e pressione Enter

// Limpar console
console.clear();

// Interceptar console.log para filtrar apenas logs de variações
const originalLog = console.log;
console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('ProductVariationSelector') ||
        message.includes('Debug variações') ||
        message.includes('Debug produto completo') ||
        message.includes('🎨') ||
        message.includes('VARIAÇÕES')) {
        originalLog.apply(console, args);
    }
};

console.log('🔍 Filtro ativado! Agora só aparecerão logs relacionados a variações.');
console.log('📝 Clique em um produto no catálogo para ver os logs de debug.');