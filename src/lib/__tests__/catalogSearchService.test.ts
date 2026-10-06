import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  searchCatalogProducts,
  computeProductDiagnostics,
  ProductSearchItem,
} from '../catalogSearchService.js';

describe('Sprint 12 — FASE B: Catalog Search & Product Intelligence', () => {
  const sampleProducts: ProductSearchItem[] = [
    {
      id: 'prod-1',
      name: 'Tênis Esportivo Ultra',
      sku: 'TEN-ESP-001',
      category: 'Calçados',
      material: 'Couro Sintético',
      product_gender: 'unissex',
      retail_price: 199.9,
      stock: 50,
      is_active: true,
      is_featured: true,
      images: [{ id: 'img-1', image_url: 'https://example.com/img1.jpg', is_primary: true }],
      variations: [
        { id: 'v1', name: 'Preto 38', sku: 'TEN-001-P38', color: 'Preto', size: '38', stock: 25 },
        { id: 'v2', name: 'Preto 39', sku: 'TEN-001-P39', color: 'Preto', size: '39', stock: 25 },
      ],
      grade_snapshots: [
        { id: 'gs-1', template_name: 'Grade Alta Feminina', items: [{ size: '38', quantity: 13 }] },
      ],
    },
    {
      id: 'prod-2',
      name: 'Sandália Rasteira Confort',
      sku: 'SAN-RAS-002',
      category: 'Calçados',
      material: 'Couro',
      product_gender: 'feminino',
      retail_price: 89.9,
      stock: 3, // Low stock (<= 5)
      stock_alert_threshold: 5,
      is_active: true,
      is_featured: false,
      images: [{ id: 'img-2', image_url: 'https://example.com/img2.jpg', is_primary: true }],
      variations: [
        { id: 'v3', name: 'Marrom 36', sku: 'SAN-002-M36', color: 'Marrom', size: '36', stock: 3 },
      ],
      grade_snapshots: [
        { id: 'gs-2', template_name: 'Grade Baixa Tradicional', items: [{ size: '36', quantity: 8 }] },
      ],
    },
    {
      id: 'prod-3',
      name: 'Camisa Polo Premium',
      sku: null, // Sem SKU
      category: 'Roupas',
      material: 'Algodão',
      product_gender: 'masculino',
      retail_price: 120.0,
      stock: 0, // Sem estoque
      is_active: false, // Inativo
      is_featured: false,
      images: [], // Sem imagem
      variations: [
        { id: 'v4', name: 'Azul', sku: null, color: 'Azul', size: null, stock: 0 }, // Incompleta
      ],
    },
    {
      id: 'prod-4',
      name: 'Bota Couro Especial',
      sku: 'BOT-ESP-004',
      category: 'Calçados',
      material: 'Couro Legítimo',
      product_gender: 'unissex',
      retail_price: 0, // Sem preço
      stock: 12,
      is_active: true,
      is_featured: false,
      images: [{ id: 'img-4', image_url: 'https://example.com/img4.jpg', is_primary: true }],
      variations: [
        { id: 'v5', name: 'Grade Verão', stock: 0, is_grade: true }, // Grade sem estoque
      ],
      grade_snapshots: [
        { id: 'gs-3', template_name: 'Grade Verão Personalizada', items: [{ size: '40', quantity: 10 }] },
      ],
    },
  ];

  it('1. Computes deterministic diagnostics correctly for all issue types', () => {
    const diag1 = computeProductDiagnostics(sampleProducts[0]);
    assert.equal(diag1.hasIssues, false);
    assert.equal(diag1.issueCount, 0);

    const diag2 = computeProductDiagnostics(sampleProducts[1]);
    assert.equal(diag2.baixo_estoque, true);
    assert.equal(diag2.sem_estoque, false);

    const diag3 = computeProductDiagnostics(sampleProducts[2]);
    assert.equal(diag3.sem_imagem, true);
    assert.equal(diag3.sem_sku, true);
    assert.equal(diag3.sem_estoque, true);
    assert.equal(diag3.variacao_incompleta, true);

    const diag4 = computeProductDiagnostics(sampleProducts[3]);
    assert.equal(diag4.sem_preco, true);
    assert.equal(diag4.grade_sem_estoque, true);
  });

  it('2. Searches by text across name, sku, variation sku, color, size, and material', () => {
    // Search by variation color
    const resColor = searchCatalogProducts(sampleProducts, { query: 'Marrom' });
    assert.equal(resColor.totalCount, 1);
    assert.equal(resColor.items[0].id, 'prod-2');

    // Search by variation size
    const resSize = searchCatalogProducts(sampleProducts, { query: '39' });
    assert.equal(resSize.totalCount, 1);
    assert.equal(resSize.items[0].id, 'prod-1');

    // Search by variation SKU
    const resVarSku = searchCatalogProducts(sampleProducts, { query: 'TEN-001-P38' });
    assert.equal(resVarSku.totalCount, 1);
    assert.equal(resVarSku.items[0].id, 'prod-1');

    // Search by material
    const resMat = searchCatalogProducts(sampleProducts, { query: 'Algodão' });
    assert.equal(resMat.totalCount, 1);
    assert.equal(resMat.items[0].id, 'prod-3');
  });

  it('3. Filters by grade type (alta, baixa, custom)', () => {
    const resAlta = searchCatalogProducts(sampleProducts, { gradeType: 'alta' });
    assert.equal(resAlta.totalCount, 1);
    assert.equal(resAlta.items[0].id, 'prod-1');

    const resBaixa = searchCatalogProducts(sampleProducts, { gradeType: 'baixa' });
    assert.equal(resBaixa.totalCount, 1);
    assert.equal(resBaixa.items[0].id, 'prod-2');

    const resCustom = searchCatalogProducts(sampleProducts, { gradeType: 'custom' });
    assert.equal(resCustom.totalCount, 1);
    assert.equal(resCustom.items[0].id, 'prod-4');
  });

  it('4. Filters by stock status (in_stock, out_of_stock, low_stock)', () => {
    const resInStock = searchCatalogProducts(sampleProducts, { stockStatus: 'in_stock' });
    assert.equal(resInStock.totalCount, 3); // prod-1 (50), prod-2 (3), prod-4 (12)

    const resOutStock = searchCatalogProducts(sampleProducts, { stockStatus: 'out_of_stock' });
    assert.equal(resOutStock.totalCount, 1);
    assert.equal(resOutStock.items[0].id, 'prod-3');

    const resLowStock = searchCatalogProducts(sampleProducts, { stockStatus: 'low_stock' });
    assert.equal(resLowStock.totalCount, 1);
    assert.equal(resLowStock.items[0].id, 'prod-2');
  });

  it('5. Filters by diagnostic issues (sem_imagem, sem_preco)', () => {
    const resNoImg = searchCatalogProducts(sampleProducts, { diagnostics: ['sem_imagem'] });
    assert.equal(resNoImg.totalCount, 1);
    assert.equal(resNoImg.items[0].id, 'prod-3');

    const resNoPrice = searchCatalogProducts(sampleProducts, { diagnostics: ['sem_preco'] });
    assert.equal(resNoPrice.totalCount, 1);
    assert.equal(resNoPrice.items[0].id, 'prod-4');
  });

  it('6. Handles pagination and sorting correctly', () => {
    const resPage1 = searchCatalogProducts(sampleProducts, { pageSize: 2, page: 1, sortBy: 'price', sortOrder: 'asc' });
    assert.equal(resPage1.items.length, 2);
    assert.equal(resPage1.totalPages, 2);
    assert.equal(resPage1.items[0].retail_price, 0); // prod-4

    const resPage2 = searchCatalogProducts(sampleProducts, { pageSize: 2, page: 2, sortBy: 'price', sortOrder: 'asc' });
    assert.equal(resPage2.items.length, 2);
    assert.equal(resPage2.items[1].retail_price, 199.9); // prod-1
  });
});
