import React, { useState, useEffect, useCallback } from "react";
import { useCatalog, CatalogType } from "@/hooks/useCatalog";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useGlobalTemplateStyles } from "@/hooks/useGlobalTemplateStyles";
import ResponsiveProductGrid from "./ResponsiveProductGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Product } from "@/types/product";

export default function PublicCatalog({ storeIdentifier }: { storeIdentifier: string }) {
  const { products, loading, catalogType } = useCatalog(storeIdentifier);
  const { settings, loading: settingsLoading } = useCatalogSettings(storeIdentifier);
  const { isReady, templateName } = useGlobalTemplateStyles(storeIdentifier);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleSearch = useCallback(() => {
    if (!products) return;

    const results = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  useEffect(() => {
    if (products) {
      setFilteredProducts(products);
    }
  }, [products]);

  return (
    <div className="min-h-screen bg-template-background">
      <header className="bg-template-surface py-4 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-template-text">
            Catálogo Público
          </h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <a href="#" className="text-template-text hover:text-template-primary">
                  Início
                </a>
              </li>
              <li>
                <a href="#" className="text-template-text hover:text-template-primary">
                  Produtos
                </a>
              </li>
              <li>
                <a href="#" className="text-template-text hover:text-template-primary">
                  Contato
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Input
              type="search"
              placeholder="Buscar produtos..."
              className="mr-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
          <Button variant="outline" size="sm" onClick={toggleFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className={`lg:col-span-1 p-4 bg-template-surface rounded-md shadow-sm ${showFilters ? '' : 'hidden lg:block'}`}>
            <h3 className="font-semibold mb-4 text-template-text">Filtros</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-template-text">Categoria</h4>
                <ul className="mt-2 space-y-1">
                  <li>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Eletrônicos
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Vestuário
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Casa e Decoração
                    </label>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-template-text">Preço</h4>
                <div className="mt-2 space-y-1">
                  <label className="flex items-center">
                    <input type="radio" name="price" className="mr-2" />
                    Até R$50
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="price" className="mr-2" />
                    R$50 - R$100
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="price" className="mr-2" />
                    Acima de R$100
                  </label>
                </div>
              </div>
            </div>
          </aside>
          
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div>
                <ResponsiveProductGrid
                  products={filteredProducts}
                  catalogType={catalogType}
                  loading={loading}
                  template={settings?.template_name as any || 'minimal'}
                  storeId={storeIdentifier}
                  editorSettings={{
                    showPrices: true,
                    showStock: true
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Não encontramos produtos que correspondam aos seus critérios de busca.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
