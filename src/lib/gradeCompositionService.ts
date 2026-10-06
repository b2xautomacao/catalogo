export interface SnapshotItemDecomposition {
  size: string;
  quantityPerPack: number;
  variationId: string | null;
}

export interface ChildMovementTrace {
  size: string;
  variationId: string | null;
  unitKind: 'unit';
  quantity: number;
  physicalQuantity: number;
  reasonCode: 'grade_component_trace';
  notes: string;
}

export interface PackDecompositionResult {
  totalPacks: number;
  totalPhysicalUnits: number;
  childMovements: ChildMovementTrace[];
  isComplete: boolean;
  missingMappingsCount: number;
}

/**
 * Decompõe um movimento de caixas/packs em movimentos analíticos filhos (Child Movement Trace).
 * 
 * Regras Canônicas:
 * - Cada filho representa a quantidade física derivada: packs * quantityPerPack.
 * - unitKind é estritamente 'unit'.
 * - reasonCode é 'grade_component_trace'.
 * - Não muta o estoque de loose units (independência de pools).
 * - Se algum item do snapshot não tiver variationId mapeado, é registrado como missing, mas o trace físico continua completo.
 */
export function decomposePackMovement(
  packs: number,
  items: SnapshotItemDecomposition[]
): PackDecompositionResult {
  const absPacks = Math.abs(packs);
  let totalPhysicalUnits = 0;
  let missingMappingsCount = 0;

  const childMovements: ChildMovementTrace[] = items.map((item) => {
    const childQty = absPacks * item.quantityPerPack;
    totalPhysicalUnits += childQty;

    if (!item.variationId) {
      missingMappingsCount++;
    }

    return {
      size: item.size,
      variationId: item.variationId,
      unitKind: 'unit',
      quantity: childQty,
      physicalQuantity: childQty,
      reasonCode: 'grade_component_trace',
      notes: `Decomposição física de ${absPacks} caixa(s): ${item.size} (${childQty} pares)`,
    };
  });

  return {
    totalPacks: absPacks,
    totalPhysicalUnits,
    childMovements,
    isComplete: missingMappingsCount === 0,
    missingMappingsCount,
  };
}

/**
 * Calcula o estoque físico canônico do produto sem duplicidade (Zero Double Count).
 * 
 * O estoque físico do produto é composto EXCLUSIVAMENTE por:
 * - Variações simples (Loose Units): stock unitário
 * - Variações de grade (Packs): stock de caixas * pares por caixa
 * 
 * Child movements pertencem ao ledger analítico e NUNCA são somados novamente.
 */
export function calculateCanonicalPhysicalStock(
  looseUnits: { stock: number }[],
  packs: { stock: number; pairsPerPack: number }[]
): {
  totalLooseStock: number;
  totalPackStock: number;
  totalPackPhysicalUnits: number;
  totalPhysicalStock: number;
} {
  const totalLooseStock = looseUnits.reduce((acc, u) => acc + (u.stock || 0), 0);
  const totalPackStock = packs.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalPackPhysicalUnits = packs.reduce(
    (acc, p) => acc + (p.stock || 0) * (p.pairsPerPack || 1),
    0
  );

  const totalPhysicalStock = totalLooseStock + totalPackPhysicalUnits;

  return {
    totalLooseStock,
    totalPackStock,
    totalPackPhysicalUnits,
    totalPhysicalStock,
  };
}
