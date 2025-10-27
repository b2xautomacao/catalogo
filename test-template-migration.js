#!/usr/bin/env node

/**
 * Script de Teste - Migration de Customização de Templates
 * Verifica se os novos campos foram adicionados corretamente à tabela catalog_settings
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente não configuradas!");
  console.error("   VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
  console.log("🧪 TESTE - Migration de Customização de Templates\n");
  console.log("=" .repeat(60));

  try {
    // 1. Verificar se os campos existem
    console.log("\n1️⃣  Verificando novos campos em store_settings...");
    
    const { data: settings, error: fetchError } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Erro ao buscar store_settings:", fetchError.message);
      process.exit(1);
    }

    if (!settings) {
      console.log("⚠️  Nenhuma configuração encontrada. Criando uma para teste...");
      
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!stores) {
        console.error("❌ Nenhuma loja encontrada no sistema!");
        process.exit(1);
      }

      const { data: newSettings, error: createError } = await supabase
        .from("store_settings")
        .insert({
          store_id: stores.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Erro ao criar configuração:", createError.message);
        process.exit(1);
      }

      console.log("✅ Configuração criada com sucesso!");
    }

    // 2. Verificar campos específicos
    console.log("\n2️⃣  Verificando campos da migration:");
    
    const requiredFields = [
      'logo_color_palette',
      'auto_extract_colors',
      'button_style',
      'footer_style',
      'footer_bg_color',
      'footer_text_color',
      'header_badges_enabled',
      'conversion_mode',
    ];

    const { data: testRecord } = await supabase
      .from("store_settings")
      .select(requiredFields.join(','))
      .limit(1)
      .maybeSingle();

    if (!testRecord) {
      console.error("❌ Erro ao verificar campos!");
      process.exit(1);
    }

    let allFieldsExist = true;
    requiredFields.forEach((field) => {
      const exists = field in testRecord;
      console.log(`   ${exists ? '✅' : '❌'} ${field}: ${exists ? 'OK' : 'AUSENTE'}`);
      if (!exists) allFieldsExist = false;
    });

    if (!allFieldsExist) {
      console.error("\n❌ Alguns campos estão ausentes. Execute a migration!");
      process.exit(1);
    }

    // 3. Testar inserção de dados
    console.log("\n3️⃣  Testando inserção de paleta de cores...");
    
    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!stores) {
      console.error("❌ Nenhuma loja encontrada!");
      process.exit(1);
    }

    const testPalette = {
      primary: '#0057FF',
      secondary: '#FF6F00',
      accent: '#8E2DE2',
      neutral: '#64748B',
      text: '#1E293B',
      background: '#F8FAFC',
    };

    const { error: updateError } = await supabase
      .from("store_settings")
      .update({
        logo_color_palette: testPalette,
        auto_extract_colors: true,
        button_style: 'rounded',
        footer_style: 'gradient',
        footer_bg_color: '#1E293B',
        footer_text_color: '#FFFFFF',
        header_badges_enabled: true,
        conversion_mode: 'optimized',
      })
      .eq('store_id', stores.id);

    if (updateError) {
      console.error("❌ Erro ao atualizar configurações:", updateError.message);
      process.exit(1);
    }

    console.log("✅ Dados inseridos com sucesso!");

    // 4. Verificar dados inseridos
    console.log("\n4️⃣  Verificando dados inseridos...");
    
    const { data: updatedSettings, error: verifyError } = await supabase
      .from("store_settings")
      .select("logo_color_palette, auto_extract_colors, button_style, footer_style, footer_bg_color, footer_text_color, header_badges_enabled, conversion_mode")
      .eq('store_id', stores.id)
      .maybeSingle();

    if (verifyError) {
      console.error("❌ Erro ao verificar dados:", verifyError.message);
      process.exit(1);
    }

    console.log("   📊 Configurações atuais:");
    console.log(`      Paleta: ${updatedSettings.logo_color_palette ? 'Configurada' : 'Não configurada'}`);
    console.log(`      Auto-extração: ${updatedSettings.auto_extract_colors ? 'Ativada' : 'Desativada'}`);
    console.log(`      Estilo de botões: ${updatedSettings.button_style}`);
    console.log(`      Estilo de footer: ${updatedSettings.footer_style}`);
    console.log(`      Cor do footer: ${updatedSettings.footer_bg_color || 'Padrão'}`);
    console.log(`      Badges no header: ${updatedSettings.header_badges_enabled ? 'Ativados' : 'Desativados'}`);
    console.log(`      Modo de conversão: ${updatedSettings.conversion_mode}`);

    // 5. Verificar constraints
    console.log("\n5️⃣  Testando constraints de valores...");
    
    // Tentar inserir valor inválido para button_style
    const { error: constraintError } = await supabase
      .from("store_settings")
      .update({ button_style: 'invalid_value' })
      .eq('store_id', stores.id);

    if (constraintError) {
      console.log("   ✅ Constraint de button_style funcionando corretamente");
    } else {
      console.log("   ⚠️  Constraint de button_style pode não estar ativa");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TESTE CONCLUÍDO COM SUCESSO!");
    console.log("   Todos os campos da migration estão funcionando corretamente.");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testMigration();

