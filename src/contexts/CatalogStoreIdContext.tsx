import React, { createContext, useContext, useState } from "react";

type CatalogStoreIdContextType = {
  storeId: string | undefined;
  setStoreId: (id: string | undefined) => void;
};

const CatalogStoreIdContext = createContext<CatalogStoreIdContextType | null>(null);

export const CatalogStoreIdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeId, setStoreId] = useState<string | undefined>(undefined);
  return (
    <CatalogStoreIdContext.Provider value={{ storeId, setStoreId }}>
      {children}
    </CatalogStoreIdContext.Provider>
  );
};

export const useCatalogStoreId = (): CatalogStoreIdContextType | null =>
  useContext(CatalogStoreIdContext);
