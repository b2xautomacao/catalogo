/**
 * Price Tier Domain Service — Sprint 10.3
 * 
 * Regras de domínio, normalização, validação e reconciliação não-destrutiva
 * para a tabela `product_price_tiers` (Atacarejo e Níveis Graduais).
 */

export interface PriceTierItem {
  id?: string;
  product_id?: string;
  tier_name: string;
  tier_order: number;
  tier_type: string;
  price: number;
  min_quantity: number;
  is_active?: boolean;
}

export interface PriceTierValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Normaliza um array de faixas de preço:
 * - Ordena por min_quantity crescente
 * - Reatribui tier_order sequencial (1..4)
 * - Garante tier_type padrão ('gradual_wholesale')
 * - Gera nomes amigáveis padrão caso não informados
 */
export function normalizePriceTiers(tiers: PriceTierItem[]): PriceTierItem[] {
  if (!tiers || tiers.length === 0) return [];

  // Clonar e ordenar por quantidade mínima crescente
  const sorted = [...tiers].sort((a, b) => (a.min_quantity || 0) - (b.min_quantity || 0));

  return sorted.slice(0, 4).map((tier, index) => {
    const order = index + 1;
    const minQty = Math.max(1, tier.min_quantity || 1);
    const tierName = tier.tier_name?.trim() || `A partir de ${minQty} un`;

    return {
      ...tier,
      tier_order: order,
      min_quantity: minQty,
      price: Number(tier.price) || 0,
      tier_name: tierName,
      tier_type: tier.tier_type || "gradual_wholesale",
      is_active: tier.is_active !== false,
    };
  });
}

/**
 * Validação semântica e estrutural das faixas de preço
 */
export function validatePriceTiers(
  tiers: PriceTierItem[],
  baseRetailPrice?: number,
  baseWholesalePrice?: number
): PriceTierValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tiers || tiers.length === 0) {
    return { valid: true, errors, warnings };
  }

  if (tiers.length > 4) {
    errors.push("O número máximo de faixas de preço permitido é 4.");
  }

  let prevQty = 0;
  let prevPrice = baseRetailPrice && baseRetailPrice > 0 ? baseRetailPrice : Infinity;

  tiers.forEach((tier, index) => {
    const position = index + 1;

    // 1. Quantidade mínima
    if (!tier.min_quantity || tier.min_quantity < 1) {
      errors.push(`Faixa ${position}: Quantidade mínima deve ser no mínimo 1.`);
    }

    if (tier.min_quantity <= prevQty) {
      errors.push(
        `Faixa ${position} (${tier.min_quantity} un): Quantidade deve ser estritamente maior que a faixa anterior (${prevQty} un).`
      );
    }

    // 2. Preço
    if (typeof tier.price !== "number" || isNaN(tier.price) || tier.price <= 0) {
      errors.push(`Faixa ${position}: O preço deve ser maior que zero.`);
    }

    // 3. Regra de consistência comercial: Preço deve diminuir conforme quantidade aumenta
    if (tier.price >= prevPrice && prevPrice !== Infinity) {
      warnings.push(
        `Faixa ${position} (R$ ${tier.price.toFixed(2)}): O valor unitário é igual ou maior que a faixa anterior. Em atacarejo, o preço costuma diminuir com a escala.`
      );
    }

    if (baseRetailPrice && baseRetailPrice > 0 && tier.price > baseRetailPrice) {
      errors.push(
        `Faixa ${position} (R$ ${tier.price.toFixed(2)}): O preço da faixa não pode ser superior ao preço de varejo (R$ ${baseRetailPrice.toFixed(2)}).`
      );
    }

    prevQty = tier.min_quantity;
    prevPrice = tier.price;
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Reconciliação não-destrutiva de faixas de preço com o Supabase.
 * - Identifica registros existentes por ID ou por tier_order
 * - Executa UPDATE nos modificados
 * - Executa INSERT nos novos
 * - Executa soft-deactivate (is_active = false) ou exclusão segura nos removidos
 */
export async function reconcileProductPriceTiers(
  supabaseClient: any,
  productId: string,
  desiredTiers: PriceTierItem[]
): Promise<{
  success: boolean;
  created: number;
  updated: number;
  removed: number;
}> {
  if (!productId) {
    throw new Error("reconcileProductPriceTiers: productId é obrigatório.");
  }

  const normalized = normalizePriceTiers(desiredTiers);
  const validation = validatePriceTiers(normalized);

  if (!validation.valid) {
    throw new Error(`Validação de faixas de preço falhou: ${validation.errors.join("; ")}`);
  }

  // 1. Buscar faixas existentes no banco de dados para este produto
  const { data: existingRows, error: fetchError } = await (supabaseClient.from("product_price_tiers") as any)
    .select("*")
    .eq("product_id", productId);

  if (fetchError) {
    console.error("Erro ao buscar faixas de preço existentes:", fetchError);
    throw fetchError;
  }

  const existingTiers = (existingRows || []) as PriceTierItem[];
  let createdCount = 0;
  let updatedCount = 0;
  let removedCount = 0;

  // 2. Mapear desiredTiers contra existingTiers
  const processedExistingIds = new Set<string>();

  for (const desired of normalized) {
    let matchedExisting: PriceTierItem | undefined;

    // Match por ID explícito
    if (desired.id) {
      matchedExisting = existingTiers.find((e) => e.id === desired.id);
    }

    // Match de fallback por tier_order
    if (!matchedExisting) {
      matchedExisting = existingTiers.find(
        (e) => e.tier_order === desired.tier_order && !processedExistingIds.has(e.id!)
      );
    }

    if (matchedExisting && matchedExisting.id) {
      processedExistingIds.add(matchedExisting.id);

      // Verificar se houve alteração real
      const hasChanged =
        matchedExisting.price !== desired.price ||
        matchedExisting.min_quantity !== desired.min_quantity ||
        matchedExisting.tier_name !== desired.tier_name ||
        matchedExisting.tier_order !== desired.tier_order ||
        matchedExisting.is_active !== desired.is_active;

      if (hasChanged) {
        const { error: updateError } = await (supabaseClient.from("product_price_tiers") as any)
          .update({
            price: desired.price,
            min_quantity: desired.min_quantity,
            tier_name: desired.tier_name,
            tier_order: desired.tier_order,
            tier_type: desired.tier_type || "gradual_wholesale",
            is_active: desired.is_active ?? true,
          })
          .eq("id", matchedExisting.id);

        if (updateError) throw updateError;
        updatedCount++;
      }
    } else {
      // Inserir novo tier
      const { error: insertError } = await (supabaseClient.from("product_price_tiers") as any).insert({
        product_id: productId,
        price: desired.price,
        min_quantity: desired.min_quantity,
        tier_name: desired.tier_name,
        tier_order: desired.tier_order,
        tier_type: desired.tier_type || "gradual_wholesale",
        is_active: desired.is_active ?? true,
      });

      if (insertError) throw insertError;
      createdCount++;
    }
  }

  // 3. Tratar registros existentes que foram removidos do formulário
  const removedTiers = existingTiers.filter((e) => e.id && !processedExistingIds.has(e.id));

  for (const removed of removedTiers) {
    if (!removed.id) continue;

    // Soft-deactivate se estava ativo ou delete seguro
    const { error: deleteError } = await (supabaseClient.from("product_price_tiers") as any)
      .delete()
      .eq("id", removed.id);

    if (deleteError) {
      // Se delete falhar por FK, fazer soft-deactivate
      const { error: softError } = await (supabaseClient.from("product_price_tiers") as any)
        .update({ is_active: false })
        .eq("id", removed.id);

      if (softError) throw softError;
    }
    removedCount++;
  }

  return {
    success: true,
    created: createdCount,
    updated: updatedCount,
    removed: removedCount,
  };
}
