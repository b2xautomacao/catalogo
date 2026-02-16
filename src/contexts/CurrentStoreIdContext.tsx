import React, { createContext, useContext } from "react";

const CurrentStoreIdContext = createContext<string | undefined>(undefined);

export const CurrentStoreIdProvider: React.FC<{
  children: React.ReactNode;
  storeId: string | undefined;
}> = ({ children, storeId }) => (
  <CurrentStoreIdContext.Provider value={storeId}>
    {children}
  </CurrentStoreIdContext.Provider>
);

export const useCurrentStoreId = (): string | undefined =>
  useContext(CurrentStoreIdContext);
