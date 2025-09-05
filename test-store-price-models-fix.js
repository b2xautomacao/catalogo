// Script de teste para verificar se o erro 406 foi corrigido
// Execute este script após aplicar a migração no Supabase

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (substitua pelos seus valores)
const supabaseUrl = 'https://uytkhyqwikdpplwsesoz.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Substitua pela sua chave

// ⚠️ IMPORTANTE: Substitua YOUR_SUPABASE_ANON_KEY pela sua chave anônima do Supabase
// Você pode encontrar essa chave em: Supabase Dashboard > Settings > API > anon public

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorePriceModels() {
    console.log('🧪 Testando correção do erro 406 na tabela store_price_models...\n');

    try {
        // Teste 1: Consulta simples sem filtro
        console.log('1️⃣ Testando consulta simples...');
        const { data: allData, error: allError } = await supabase
            .from('store_price_models')
            .select('*');

        if (allError) {
            console.error('❌ Erro na consulta simples:', allError);
            return false;
        }
        console.log('✅ Consulta simples funcionou. Registros encontrados:', allData ? .length || 0);

        // Teste 2: Consulta com filtro por store_id
        console.log('\n2️⃣ Testando consulta com filtro...');
        const testStoreId = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';
        const { data: filteredData, error: filteredError } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', testStoreId);

        if (filteredError) {
            console.error('❌ Erro na consulta filtrada:', filteredError);
            return false;
        }
        console.log('✅ Consulta filtrada funcionou. Registros encontrados:', filteredData ? .length || 0);

        // Teste 3: Consulta com single()
        console.log('\n3️⃣ Testando consulta com single()...');
        const { data: singleData, error: singleError } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', testStoreId)
            .single();

        if (singleError && singleError.code !== 'PGRST116') {
            console.error('❌ Erro na consulta single():', singleError);
            return false;
        }
        console.log('✅ Consulta single() funcionou. Dados:', singleData ? 'Encontrado' : 'Não encontrado');

        // Teste 4: Verificar estrutura da tabela
        console.log('\n4️⃣ Verificando estrutura da tabela...');
        const { data: structureData, error: structureError } = await supabase
            .from('store_price_models')
            .select('*')
            .limit(1);

        if (structureError) {
            console.error('❌ Erro ao verificar estrutura:', structureError);
            return false;
        }

        if (structureData && structureData.length > 0) {
            const record = structureData[0];
            console.log('✅ Estrutura da tabela:');
            console.log('   - Colunas encontradas:', Object.keys(record).length);
            console.log('   - Campos de pedido mínimo:', {
                minimum_purchase_enabled: 'minimum_purchase_enabled' in record,
                minimum_purchase_amount: 'minimum_purchase_amount' in record,
                minimum_purchase_message: 'minimum_purchase_message' in record
            });
        }

        console.log('\n🎉 Todos os testes passaram! O erro 406 foi corrigido.');
        return true;

    } catch (error) {
        console.error('💥 Erro inesperado:', error);
        return false;
    }
}

// Executar teste
testStorePriceModels().then(success => {
    if (success) {
        console.log('\n✅ Correção do erro 406 aplicada com sucesso!');
        process.exit(0);
    } else {
        console.log('\n❌ Ainda há problemas. Verifique os logs acima.');
        process.exit(1);
    }
});