// Script de teste para verificar correção do registro faltante
// Execute este script após aplicar a migração

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://uytkhyqwikdpplwsesoz.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // ⚠️ SUBSTITUA pela sua chave

const supabase = createClient(supabaseUrl, supabaseKey);

// Store IDs para teste
const PROBLEMATIC_STORE_ID = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c'; // Que estava falhando
const WORKING_STORE_ID = 'e5d0288d-b4c1-47ab-bbd6-2764c2362278'; // Que estava funcionando

async function testMissingRecordFix() {
    console.log('🔍 Testando correção do registro faltante');
    console.log('Store ID problemático:', PROBLEMATIC_STORE_ID);
    console.log('Store ID funcionando:', WORKING_STORE_ID);
    console.log('='.repeat(60));

    const results = {
        tests: [],
        success: true,
        errors: []
    };

    // Teste 1: Verificar se o registro problemático agora existe
    console.log('\n1️⃣ Verificando se o registro problemático agora existe...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', PROBLEMATIC_STORE_ID)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('❌ Registro ainda não existe para store problemático');
                results.tests.push({ name: 'Registro problemático existe', success: false, error });
                results.success = false;
            } else {
                console.error('❌ Erro ao verificar registro problemático:', error);
                results.tests.push({ name: 'Registro problemático existe', success: false, error });
                results.success = false;
            }
        } else {
            console.log('✅ Registro problemático agora existe!');
            console.log('   ID:', data.id);
            console.log('   Price Model:', data.price_model);
            console.log('   Minimum Purchase:', data.minimum_purchase_enabled);
            results.tests.push({ name: 'Registro problemático existe', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado ao verificar registro problemático:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 2: Verificar se o registro funcionando ainda existe
    console.log('\n2️⃣ Verificando se o registro funcionando ainda existe...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', WORKING_STORE_ID)
            .single();

        if (error) {
            console.error('❌ Erro ao verificar registro funcionando:', error);
            results.tests.push({ name: 'Registro funcionando existe', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Registro funcionando ainda existe!');
            console.log('   ID:', data.id);
            console.log('   Price Model:', data.price_model);
            results.tests.push({ name: 'Registro funcionando existe', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado ao verificar registro funcionando:', err);
        results.errors.push(err);
    }

    // Teste 3: Testar consulta que estava falhando
    console.log('\n3️⃣ Testando consulta que estava falhando...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', PROBLEMATIC_STORE_ID);

        if (error) {
            console.error('❌ Consulta problemática ainda falha:', error);
            results.tests.push({ name: 'Consulta problemática', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Consulta problemática agora funciona!');
            console.log('   Registros encontrados:', data ? .length || 0);
            if (data && data.length > 0) {
                console.log('   Primeiro registro:', {
                    id: data[0].id,
                    store_id: data[0].store_id,
                    price_model: data[0].price_model,
                    minimum_purchase_enabled: data[0].minimum_purchase_enabled
                });
            }
            results.tests.push({ name: 'Consulta problemática', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na consulta problemática:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 4: Testar consulta com single()
    console.log('\n4️⃣ Testando consulta com single()...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', PROBLEMATIC_STORE_ID)
            .single();

        if (error) {
            console.error('❌ Consulta single() falha:', error);
            results.tests.push({ name: 'Consulta single()', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Consulta single() funciona!');
            console.log('   Dados:', {
                id: data.id,
                store_id: data.store_id,
                price_model: data.price_model
            });
            results.tests.push({ name: 'Consulta single()', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na consulta single():', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 5: Verificar todos os registros
    console.log('\n5️⃣ Verificando todos os registros na tabela...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('store_id, price_model, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro ao listar todos os registros:', error);
            results.tests.push({ name: 'Listar todos os registros', success: false, error });
        } else {
            console.log('✅ Lista de todos os registros:');
            data ? .forEach((record, index) => {
                const isProblematic = record.store_id === PROBLEMATIC_STORE_ID;
                const isWorking = record.store_id === WORKING_STORE_ID;
                const marker = isProblematic ? '🎯' : isWorking ? '✅' : '📋';
                console.log(`   ${marker} ${index + 1}. ${record.store_id} - ${record.price_model} (${record.created_at})`);
            });
            results.tests.push({ name: 'Listar todos os registros', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado ao listar registros:', err);
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
            console.log(`   Erro: ${test.error.code || 'N/A'} - ${test.error.message || 'N/A'}`);
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
        console.log('🎉 PROBLEMA RESOLVIDO!');
        console.log('✅ O registro faltante foi criado com sucesso!');
        console.log('✅ As consultas agora funcionam normalmente!');
    } else {
        console.log('❌ AINDA HÁ PROBLEMAS');
        console.log('🔧 Aplique a migração migrations/20250129000007-fix-missing-store-price-model.sql');
    }
    console.log('='.repeat(60));

    return results;
}

// Executar teste
if (require.main === module) {
    testMissingRecordFix().then(results => {
        process.exit(results.success ? 0 : 1);
    });
}

module.exports = { testMissingRecordFix };