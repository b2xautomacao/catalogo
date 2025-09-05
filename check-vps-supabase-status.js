// Script para verificar status do Supabase na VPS
// Execute este script no ambiente da VPS para diagnosticar o problema

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (mesmas da VPS)
const supabaseUrl = 'https://uytkhyqwikdpplwsesoz.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // ⚠️ SUBSTITUA pela sua chave

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_STORE_ID = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';

async function checkVPSSupabaseStatus() {
    console.log('🔍 Verificando status do Supabase na VPS');
    console.log('URL:', supabaseUrl);
    console.log('Store ID:', TEST_STORE_ID);
    console.log('='.repeat(60));

    const results = {
        environment: 'VPS',
        timestamp: new Date().toISOString(),
        tests: [],
        success: true,
        errors: []
    };

    // Teste 1: Verificar conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    try {
        const { data, error } = await supabase
            .from('stores')
            .select('id, name')
            .limit(1);

        if (error) {
            console.error('❌ Erro na conexão básica:', error);
            results.tests.push({ name: 'Conexão básica', success: false, error });
            results.success = false;
        } else {
            console.log('✅ Conexão básica funcionou!');
            console.log('   Dados:', data);
            results.tests.push({ name: 'Conexão básica', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na conexão básica:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 2: Verificar se tabela store_price_models existe
    console.log('\n2️⃣ Verificando se tabela store_price_models existe...');
    try {
        const { data, error } = await supabase
            .from('store_price_models')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Erro ao acessar store_price_models:', error);
            console.error('   Código do erro:', error.code);
            console.error('   Mensagem:', error.message);
            console.error('   Detalhes:', error.details);
            console.error('   Hint:', error.hint);

            results.tests.push({
                name: 'Acesso à tabela store_price_models',
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                }
            });
            results.success = false;
        } else {
            console.log('✅ Tabela store_price_models acessível!');
            console.log('   Registros encontrados:', data ? .length || 0);
            results.tests.push({ name: 'Acesso à tabela store_price_models', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado ao acessar store_price_models:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 3: Verificar políticas RLS
    console.log('\n3️⃣ Verificando políticas RLS...');
    try {
        // Tentar consulta que deveria funcionar com RLS
        const { data, error } = await supabase
            .from('store_price_models')
            .select('id, store_id, price_model')
            .eq('store_id', TEST_STORE_ID);

        if (error) {
            console.error('❌ Erro na consulta com RLS:', error);
            console.error('   Código:', error.code);
            console.error('   Mensagem:', error.message);

            results.tests.push({
                name: 'Consulta com RLS',
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
            results.success = false;
        } else {
            console.log('✅ Consulta com RLS funcionou!');
            console.log('   Registros:', data ? .length || 0);
            results.tests.push({ name: 'Consulta com RLS', success: true, data });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na consulta com RLS:', err);
        results.errors.push(err);
        results.success = false;
    }

    // Teste 4: Verificar se usuário está autenticado
    console.log('\n4️⃣ Verificando autenticação...');
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('❌ Erro na autenticação:', error);
            results.tests.push({ name: 'Autenticação', success: false, error });
        } else if (user) {
            console.log('✅ Usuário autenticado!');
            console.log('   ID:', user.id);
            console.log('   Email:', user.email);
            results.tests.push({ name: 'Autenticação', success: true, user: { id: user.id, email: user.email } });
        } else {
            console.log('⚠️ Nenhum usuário autenticado (modo anônimo)');
            results.tests.push({ name: 'Autenticação', success: true, user: null });
        }
    } catch (err) {
        console.error('💥 Erro inesperado na autenticação:', err);
        results.errors.push(err);
    }

    // Teste 5: Verificar outras tabelas para comparar
    console.log('\n5️⃣ Verificando outras tabelas para comparação...');
    const tablesToTest = ['stores', 'products', 'profiles'];

    for (const table of tablesToTest) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.error(`❌ Erro ao acessar ${table}:`, error.code, error.message);
                results.tests.push({ name: `Acesso à tabela ${table}`, success: false, error });
            } else {
                console.log(`✅ Tabela ${table} acessível!`);
                results.tests.push({ name: `Acesso à tabela ${table}`, success: true, data });
            }
        } catch (err) {
            console.error(`💥 Erro inesperado ao acessar ${table}:`, err);
            results.errors.push(err);
        }
    }

    // Resumo dos resultados
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO DIAGNÓSTICO VPS');
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
    console.log('🔧 PRÓXIMOS PASSOS:');

    if (!results.success) {
        console.log('1. Execute o script de diagnóstico SQL no Supabase Dashboard');
        console.log('2. Aplique a migração agressiva');
        console.log('3. Verifique se as migrações foram aplicadas na VPS');
        console.log('4. Compare com o ambiente localhost');
    } else {
        console.log('✅ Todos os testes passaram! O problema pode ser específico da consulta.');
    }

    console.log('='.repeat(60));

    return results;
}

// Executar diagnóstico
if (require.main === module) {
    checkVPSSupabaseStatus().then(results => {
        console.log('\n📋 Resultado final:', results.success ? 'SUCESSO' : 'FALHA');
        process.exit(results.success ? 0 : 1);
    });
}

module.exports = { checkVPSSupabaseStatus };