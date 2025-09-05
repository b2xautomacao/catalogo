// Script para testar persistência de pedido mínimo
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersistence() {
    console.log('🔍 Testando persistência de pedido mínimo...');

    const testStoreId = 'e5d0288d-b4c1-47ab-bbd6-2764c2362278'; // Store ID da imagem

    try {
        // 1. Verificar dados atuais
        console.log('📊 1. Verificando dados atuais...');
        const { data: currentData, error: currentError } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', testStoreId)
            .single();

        if (currentError) {
            console.error('❌ Erro ao buscar dados atuais:', currentError);
            return;
        }

        console.log('📊 Dados atuais:', currentData);

        // 2. Testar update
        console.log('🔄 2. Testando update...');
        const updateData = {
            minimum_purchase_enabled: true,
            minimum_purchase_amount: 150.00,
            minimum_purchase_message: 'Pedido mínimo de R$ {amount} para finalizar a compra'
        };

        const { data: updateResult, error: updateError } = await supabase
            .from('store_price_models')
            .update(updateData)
            .eq('store_id', testStoreId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Erro no update:', updateError);
            return;
        }

        console.log('✅ Update realizado:', updateResult);

        // 3. Verificar se persistiu
        console.log('🔍 3. Verificando se persistiu...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', testStoreId)
            .single();

        if (verifyError) {
            console.error('❌ Erro ao verificar persistência:', verifyError);
            return;
        }

        console.log('📊 Dados após update:', verifyData);
        console.log('🔍 Campos de pedido mínimo:', {
            minimum_purchase_enabled: verifyData.minimum_purchase_enabled,
            minimum_purchase_amount: verifyData.minimum_purchase_amount,
            minimum_purchase_message: verifyData.minimum_purchase_message,
        });

        // 4. Testar upsert
        console.log('🔄 4. Testando upsert...');
        const upsertData = {
            store_id: testStoreId,
            minimum_purchase_enabled: true,
            minimum_purchase_amount: 250.00,
            minimum_purchase_message: 'Pedido mínimo de R$ {amount} para finalizar a compra'
        };

        const { data: upsertResult, error: upsertError } = await supabase
            .from('store_price_models')
            .upsert(upsertData)
            .select()
            .single();

        if (upsertError) {
            console.error('❌ Erro no upsert:', upsertError);
            return;
        }

        console.log('✅ Upsert realizado:', upsertResult);

        // 5. Verificar se persistiu
        console.log('🔍 5. Verificando se persistiu após upsert...');
        const { data: finalData, error: finalError } = await supabase
            .from('store_price_models')
            .select('*')
            .eq('store_id', testStoreId)
            .single();

        if (finalError) {
            console.error('❌ Erro ao verificar persistência final:', finalError);
            return;
        }

        console.log('📊 Dados finais:', finalData);
        console.log('🔍 Campos de pedido mínimo finais:', {
            minimum_purchase_enabled: finalData.minimum_purchase_enabled,
            minimum_purchase_amount: finalData.minimum_purchase_amount,
            minimum_purchase_message: finalData.minimum_purchase_message,
        });

        console.log('🎉 Teste de persistência concluído!');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

testPersistence();
