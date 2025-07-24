
import React, { useState } from "react";
import CatalogHeader from "./CatalogHeader";
import ResponsiveProductGrid from "./ResponsiveProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { useStoreData } from "@/hooks/useStoreData";
import { useCart } from "@/hooks/useCart";

export type CatalogType = "retail" | "wholesale";

interface CatalogExampleProps {
  storeSlug: string;
}

const CatalogExample: React.FC<CatalogExampleProps> = ({ storeSlug }) => {
  const { store, loading: storeLoading } = useStoreData(storeSlug);
  const { products, loading: productsLoading } = useProducts();
  const { totalItems, toggleCart } = useCart();
  
  const [catalogType, setCatalogType] = useState<CatalogType>("retail");
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Carregando loja...
          </h2>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loja não encontrada
          </h2>
          <p className="text-gray-600">
            A loja que você está procurando não existe ou está indisponível.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do Catálogo */}
      <CatalogHeader
        store={store}
        catalogType={catalogType}
        onCatalogTypeChange={setCatalogType}
        cartItemsCount={totalItems}
        wishlistCount={wishlistCount}
        whatsappNumber={store.phone || ""}
        onSearch={handleSearch}
        onCartClick={toggleCart}
      />

      {/* Conteúdo Principal */}
      <main className="pt-4">
        <ResponsiveProductGrid
          products={products}
          catalogType={catalogType}
          loading={productsLoading}
          className="container mx-auto px-4"
          storeId={store.id}
        />
      </main>

      {/* Footer (opcional) */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <h3 className="font-semibold text-lg mb-2">{store.name}</h3>
            {store.description && (
              <p className="text-sm mb-4">{store.description}</p>
            )}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span>Desenvolvido com VendeMais</span>
              {store.phone && (
                <a
                  href={`https://wa.me/${store.phone}`}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: {store.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CatalogExample;
