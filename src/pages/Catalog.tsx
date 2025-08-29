
import React from 'react';
import { useParams } from 'react-router-dom';
import PublicCatalog from '@/components/catalog/PublicCatalog';

const Catalog = () => {
  const { storeSlug } = useParams<{
    storeSlug: string;
  }>();

  if (!storeSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">URL inválida</h1>
          <p className="text-gray-600">Slug da loja não fornecido.</p>
        </div>
      </div>
    );
  }

  return <PublicCatalog storeIdentifier={storeSlug} catalogType="retail" />;
};

export default Catalog;
