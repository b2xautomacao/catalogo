// Script para testar especificamente os campos de pedido mínimo
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMinimumPurchase() {
    console.log('🔍 Testando campos de pedido mínimo...');

    try {
        // Verificar se as colunas existem
        const { data: columns, error: columnsError } = await supabase
            .rpc('get_table_columns', { table_name: 'store_price_models' });

        if (columnsError) {
            console.log('⚠️ Não foi possível verificar colunas via RPC, tentando método alternativo...');
        } else {
            console.log('📊 Colunas da tabela store_price_models:', columns);
        }

        // Testar inserção de dados com campos de pedido mínimo
        const testData = {
            store_id: '00000000-0000-0000-0000-000000000001',
            price_model: 'retail_only',
            minimum_purchase_enabled: true,
            minimum_purchase_amount: 100.50,
            minimum_purchase_message: 'Pedido mínimo de R$ {amount} para finalizar a compra'
        };

        console.log('🔄 Inserindo dados de teste:', testData);

        const { data: insertData, error: insertError } = await supabase
            .from('store_price_models')
            .upsert(testData)
            .select();

        if (insertError) {
            console.error('❌ Erro ao inserir dados de teste:', insertError);
            console.error('❌ Detalhes do erro:', insertError.details);
            console.error('❌ Código do erro:', insertError.code);
            return;
        }

        console.log('✅ Dados de teste inseridos com sucesso:', insertData);

        // Verificar se os dados foram salvos corretamente
        const { data: verifyData, error: verifyError } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', '00000000-0000-0000-0000-000000000001')
            .single();

        if (verifyError) {
            console.error('❌ Erro ao verificar dados:', verifyError);
            return;
        }

        console.log('✅ Dados verificados:', verifyData);
        console.log('🔍 Campos de pedido mínimo:', {
            minimum_purchase_enabled: verifyData.minimum_purchase_enabled,
            minimum_purchase_amount: verifyData.minimum_purchase_amount,
            minimum_purchase_message: verifyData.minimum_purchase_message,
        });

        // Limpar dados de teste
        await supabase
            .from('store_price_models')
            .delete()
            .eq('store_id', '00000000-0000-0000-0000-000000000001');

        console.log('✅ Dados de teste removidos');
        console.log('🎉 Teste de pedido mínimo concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

testMinimumPurchase();
