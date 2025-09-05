// Script de teste completo para verificar correção do erro 406
// Execute este script após aplicar a migração agressiva

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://uytkhyqwikdpplwsesoz.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // ⚠️ SUBSTITUA pela sua chave

const supabase = createClient(supabaseUrl, supabaseKey);

// Store ID específico que está causando o erro
const TEST_STORE_ID = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';

async function testStorePriceModelsComplete() {
    console.log('🔍 Teste completo para correção do erro 406');
    console.log('Store ID de teste:', TEST_STORE_ID);
    console.log('='.repeat(60));

    const results = {
        tests: [],
        success: true,
        errors: []
    };

    // Teste 1: Consulta exata que está falhando
    console.log('\n1️⃣ Testando consulta exata que estava falhando...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', TEST_STORE_ID);

        if (error) {
            console.error('❌ Erro na consulta exata:', error);
            results.tests.push({ name: 'Consulta exata', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Consulta exata funcionou!');
            console.log('   Registros encontrados:', data ? .length || 0);
            results.tests.push({ name: 'Consulta exata', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na consulta exata:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 2: Consulta com single()
    console.log('\n2️⃣ Testando consulta com single()...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', TEST_STORE_ID)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Erro na consulta single():', error);
            results.tests.push({ name: 'Consulta single()', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Consulta single() funcionou!');
            console.log('   Dados encontrados:', data ? 'Sim' : 'Não');
            results.tests.push({ name: 'Consulta single()', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na consulta single():', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 3: Consulta sem filtro
    console.log('\n3️⃣ Testando consulta sem filtro...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*');

        if (error) {
            console.error('❌ Erro na consulta sem filtro:', error);
            results.tests.push({ name: 'Consulta sem filtro', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Consulta sem filtro funcionou!');
            console.log('   Total de registros:', data ? .length || 0);
            results.tests.push({ name: 'Consulta sem filtro', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na consulta sem filtro:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 4: Consulta com campos específicos
    console.log('\n4️⃣ Testando consulta com campos específicos...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('id, store_id, price_model, minimum_purchase_enabled')
            .eq('store_id', TEST_STORE_ID);

        if (error) {
            console.error('❌ Erro na consulta com campos específicos:', error);
            results.tests.push({ name: 'Consulta campos específicos', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Consulta com campos específicos funcionou!');
            console.log('   Registros encontrados:', data ? .length || 0);
            if (data && data.length > 0) {
                console.log('   Primeiro registro:', data[0]);
            }
            results.tests.push({ name: 'Consulta campos específicos', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na consulta com campos específicos:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 5: Teste de inserção (se possível)
    console.log('\n5️⃣ Testando inserção de dados de teste...');
    try {
        const testData = {
            store_id: TEST_STORE_ID,
            price_model: 'retail_only',
            minimum_purchase_enabled: false,
            minimum_purchase_amount: 0.00,
            minimum_purchase_message: 'Teste de inserção'
        };

        const { data, error } = await supabase
            .from('store_price_models')
            .upsert(testData)
            .select();

        if (error) {
            console.error('❌ Erro na inserção:', error);
            results.tests.push({ name: 'Inserção de dados', success: false, error });
            // Não marcar como falha total, pois pode ser problema de permissão
        } else {
            console.log('✅ Inserção funcionou!');
            console.log('   Dados inseridos:', data);
            results.tests.push({ name: 'Inserção de dados', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na inserção:', err);
        results.errors.push(err);
    }

    // Resumo dos resultados
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));

    results.tests.forEach((test, index) => {
        const status = test.success ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${test.name}`);
        if (!test.success && test.error) {
            console.log(`   Erro: ${test.error.message || test.error}`);
        }
    });

    if (results.errors.length > 0) {
        console.log('\n🚨 ERROS INESPERADOS:');
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.message}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    if (results.success) {
        console.log('🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ O erro 406 foi corrigido com sucesso!');
    } else {
        console.log('❌ ALGUNS TESTES FALHARAM');
        console.log('🔧 Verifique os erros acima e aplique a migração agressiva');
    }
    console.log('='.repeat(60));

    return results;
}

// Executar teste
if (require.main === module) {
    testStorePriceModelsComplete().then(results => {
        process.exit(results.success ? 0 : 1);
    });
}

module.exports = { testStorePriceModelsComplete };