import React from "react";
import { useParams, useLocation } from "react-router-dom";
import PublicCatalog from "@/components/catalog/PublicCatalog";

const RESERVED_SLUGS = ["produto", "catalog", "track", "auth", "c"];

/** Extrai sellerSlug do splat (ex: "daniel" ou "produto/123" → no segundo caso, não é vendedor) */
function extractSellerSlugFromSplat(splat: string | undefined): string | undefined {
  if (!splat) return undefined;
  const firstSegment = splat.split("/")[0]?.toLowerCase().trim();
  if (!firstSegment || RESERVED_SLUGS.includes(firstSegment)) return undefined;
  // Se tem mais de um segmento (ex: produto/123), não é slug de vendedor
  if (splat.includes("/")) return undefined;
  return firstSegment;
}

const PublicCatalogPage = () => {
  const params = useParams<{
    storeIdentifier?: string;
    storeSlug?: string;
    productId?: string;
    "*"?: string;
  }>();
  const location = useLocation();

  const storeId = params.storeIdentifier || params.storeSlug;
  const sellerSlug = extractSellerSlugFromSplat(params["*"]);

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            URL inválida
          </h1>
          <p className="text-gray-600">Identificador da loja não fornecido.</p>
          <p className="text-sm text-gray-500 mt-2">
            URL atual: {location.pathname}
          </p>
        </div>
      </div>
    );
  }

  if (params.productId && params.storeSlug) {
    console.log('Legacy product URL detected:', { storeSlug: params.storeSlug, productId: params.productId });
  }

  return <PublicCatalog storeIdentifier={storeId} sellerSlug={sellerSlug} />;
};

export default PublicCatalogPage;
