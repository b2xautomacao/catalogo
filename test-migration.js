// Script para testar se a migration foi aplicada corretamente
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
    console.log('🔍 Testando migration de pedido mínimo...');

    try {
        // Verificar se as colunas existem
        const { data, error } = await supabase
            .from('store_price_models')
            .select('minimum_purchase_enabled, minimum_purchase_amount, minimum_purchase_message')
            .limit(1);

        if (error) {
            console.error('❌ Erro ao verificar colunas:', error);
            return;
        }

        console.log('✅ Colunas de pedido mínimo existem na tabela');
        console.log('📊 Dados de exemplo:', data);

        // Testar inserção de dados
        const testData = {
            store_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
            price_model: 'retail_only',
            minimum_purchase_enabled: true,
            minimum_purchase_amount: 50.00,
            minimum_purchase_message: 'Pedido mínimo de R$ {amount} para finalizar a compra'
        };

        const { data: insertData, error: insertError } = await supabase
            .from('store_price_models')
            .upsert(testData)
            .select();

        if (insertError) {
            console.error('❌ Erro ao inserir dados de teste:', insertError);
            return;
        }

        console.log('✅ Dados de teste inseridos com sucesso:', insertData);

        // Limpar dados de teste
        await supabase
            .from('store_price_models')
            .delete()
            .eq('store_id', '00000000-0000-0000-0000-000000000000');

        console.log('✅ Dados de teste removidos');
        console.log('🎉 Migration testada com sucesso!');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

testMigration();
