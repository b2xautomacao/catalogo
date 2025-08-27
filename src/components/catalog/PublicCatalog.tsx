import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Heart, ShoppingCart, Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { useShoppingCart } from "@/hooks/useShoppingCart";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useEditorSync } from "@/hooks/useEditorSync";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "./ProductCard";
import ProductDetailsModal from "@/components/catalog/ProductDetailsModal";
import DynamicMetaTags from "@/components/seo/DynamicMetaTags";

interface PublicCatalogProps {
  catalogType?: "retail" | "wholesale";
}

const PublicCatalog: React.FC<PublicCatalogProps> = ({
  catalogType = "retail",
}) => {
  const { storeIdentifier } = useParams<{ storeIdentifier: string }>();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  const { user } = useAuth();
  const { addItem } = useShoppingCart();
  const { toast } = useToast();
  
  const { store, products, filteredProducts, loading, storeError } = useCatalog(storeIdentifier, catalogType);
  const { settings, loading: settingsLoading } = useCatalogSettings(storeIdentifier);
  
  useEditorSync(storeIdentifier || '');

  useEffect(() => {
    if (store?.id && !loading) {
      console.log("Loja carregada:", store.name, "ID:", store.id);
    }
  }, [store, loading]);

  const handleAddToCart = (product: any, quantity: number = 1) => {
    const price = catalogType === "wholesale" && product.wholesale_price 
      ? product.wholesale_price 
      : product.retail_price;

    addItem(product, quantity);
    
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  };

  const filteredProductsDisplay = products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loja não encontrada</h1>
          <p className="text-muted-foreground">
            {storeError || "A loja que você está procurando não existe ou foi removida."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DynamicMetaTags
        storeIdentifier={storeIdentifier}
        catalogType={catalogType}
        customTitle={`${store.name} - Catálogo ${catalogType === "wholesale" ? "Atacado" : "Varejo"}`}
        customDescription={store.description}
      />

      {/* Header do Catálogo */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="h-8 w-auto"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-primary">{store.name}</h1>
                )}
              </div>
            </div>

            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="pl-10 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid de Produtos */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {filteredProductsDisplay?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onViewDetails={handleProductClick}
              catalogType={catalogType}
            />
          ))}
        </div>

        {filteredProductsDisplay?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum produto encontrado.
            </p>
          </div>
        )}
      </main>

      {/* Modal de Detalhes do Produto */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          catalogType={catalogType}
        />
      )}
    </div>
  );
};

export default PublicCatalog;
