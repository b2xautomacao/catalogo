
import React from 'react';
import { useParams } from 'react-router-dom';
import PublicCatalog from '@/components/catalog/PublicCatalog';
import { CatalogType } from '@/hooks/useCatalog';

const Catalog = () => {
  const { storeIdentifier, catalogType } = useParams<{
    storeIdentifier: string;
    catalogType?: string;
  }>();

  if (!storeIdentifier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">URL inválida</h1>
          <p className="text-gray-600">Identificador da loja não fornecido.</p>
        </div>
      </div>
    );
  }

  const validCatalogType: CatalogType = 
    catalogType === 'wholesale' ? 'wholesale' : 'retail';

  return (
    <PublicCatalog 
      storeIdentifier={storeIdentifier}
      catalogType={validCatalogType}
    />
  );
};

export default Catalog;
