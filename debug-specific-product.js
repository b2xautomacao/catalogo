/**
 * Script para verificar variações de um produto específico
 * Execute: node debug-specific-product.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wxfuhsxhsiqrmqfphwaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZnVoc3hoc2lxcm1xZnBod2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NDE4NjgsImV4cCI6MjA1MjAxNzg2OH0.3eaWowGS4TRkXIW5ub4nHXV5T3DUuNqO_p3pWyIiMBA';

const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCT_ID = '9d556c2d-2c20-44c2-ae00-512475aca6c4';
const PRODUCT_NAME = 'Tênis Adidas NMB';

async function debugSpecificProduct() {
    try {
        console.log(`🔍 DEBUG - Verificando produto: ${PRODUCT_NAME}`);
        console.log(`📋 ID do produto: ${PRODUCT_ID}\n`);

        // 1. Verificar se o produto existe
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, store_id, is_active')
            .eq('id', PRODUCT_ID)
            .single();

        if (productError) {
            console.error('❌ Erro ao buscar produto:', productError);
            return;
        }

        if (!product) {
            console.error('❌ Produto não encontrado!');
            return;
        }

        console.log('✅ Produto encontrado:');
        console.log(`   Nome: ${product.name}`);
        console.log(`   Store ID: ${product.store_id}`);
        console.log(`   Ativo: ${product.is_active}\n`);

        // 2. Buscar TODAS as variações (ativas e inativas)
        const { data: allVariations, error: allVariationsError } = await supabase
            .from('product_variations')
            .select('*')
            .eq('product_id', PRODUCT_ID)
            .order('created_at', { ascending: true });

        if (allVariationsError) {
            console.error('❌ Erro ao buscar todas as variações:', allVariationsError);
            return;
        }

        console.log(`📊 Total de variações no banco: ${allVariations?.length || 0}`);

        if (!allVariations || allVariations.length === 0) {
            console.log('❌ Nenhuma variação encontrada no banco de dados!');
            return;
        }

        // 3. Separar variações ativas e inativas
        const activeVariations = allVariations.filter(v => v.is_active);
        const inactiveVariations = allVariations.filter(v => !v.is_active);

        console.log(`✅ Variações ativas: ${activeVariations.length}`);
        console.log(`⚠️  Variações inativas: ${inactiveVariations.length}\n`);

        // 4. Analisar variações ativas
        if (activeVariations.length > 0) {
            console.log('🎨 Análise das variações ATIVAS:');

            const colors = [...new Set(activeVariations.filter(v => v.color).map(v => v.color))];
            const sizes = [...new Set(activeVariations.filter(v => v.size).map(v => v.size))];
            const grades = activeVariations.filter(v => v.is_grade || v.variation_type === 'grade');

            console.log(`   Cores únicas: ${colors.length} → [${colors.join(', ')}]`);
            console.log(`   Tamanhos únicos: ${sizes.length} → [${sizes.join(', ')}]`);
            console.log(`   Grades: ${grades.length}\n`);

            // Mostrar detalhes de cada variação ativa
            console.log('📋 Detalhes das variações ativas:');
            activeVariations.forEach((v, idx) => {
                console.log(`\n   Variação ${idx + 1}:`);
                console.log(`      ID: ${v.id}`);
                console.log(`      Cor: ${v.color || 'N/A'}`);
                console.log(`      Tamanho: ${v.size || 'N/A'}`);
                console.log(`      SKU: ${v.sku || 'N/A'}`);
                console.log(`      Tipo: ${v.variation_type || 'N/A'}`);
                console.log(`      É Grade?: ${v.is_grade ? 'SIM' : 'NÃO'}`);
                console.log(`      Estoque: ${v.stock || 0}`);
                console.log(`      Ativo?: ${v.is_active ? 'SIM' : 'NÃO'}`);
                console.log(`      Criado em: ${v.created_at}`);
            });
        }

        // 5. Analisar variações inativas (se houver)
        if (inactiveVariations.length > 0) {
            console.log(`\n⚠️  Variações INATIVAS encontradas: ${inactiveVariations.length}`);
            console.log('   (Estas não aparecem no catálogo)');

            const inactiveColors = [...new Set(inactiveVariations.filter(v => v.color).map(v => v.color))];
            const inactiveSizes = [...new Set(inactiveVariations.filter(v => v.size).map(v => v.size))];

            console.log(`   Cores inativas: [${inactiveColors.join(', ')}]`);
            console.log(`   Tamanhos inativos: [${inactiveSizes.join(', ')}]`);
        }

        // 6. Verificar se há problema na query do catálogo
        console.log('\n🔍 Simulando query do catálogo:');

        const { data: catalogVariations, error: catalogError } = await supabase
            .from('product_variations')
            .select('*')
            .eq('product_id', PRODUCT_ID)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (catalogError) {
            console.error('❌ Erro na query do catálogo:', catalogError);
        } else {
            console.log(`✅ Query do catálogo retornou: ${catalogVariations?.length || 0} variações`);

            if (catalogVariations && catalogVariations.length !== activeVariations.length) {
                console.log('⚠️  DIFERENÇA: Query do catálogo retorna resultado diferente!');
                console.log(`   Variações ativas: ${activeVariations.length}`);
                console.log(`   Query catálogo: ${catalogVariations.length}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ DEBUG concluído!');

    } catch (error) {
        console.error('💥 Erro inesperado:', error);
    }
}

debugSpecificProduct();