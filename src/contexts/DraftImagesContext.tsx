import React, { createContext, useContext, ReactNode } from "react";
import { useDraftImages, DraftImage } from "@/hooks/useDraftImages";

interface DraftImagesContextType {
  draftImages: DraftImage[];
  uploading: boolean;
  isUploading: boolean;
  isLoading: boolean;
  addDraftImage: (file: File) => void;
  addDraftImages: (files: File[]) => void;
  removeDraftImage: (imageId: string) => void;
  setPrimaryImage: (imageId: string) => void;
  reorderImages: (imageId: string, newIndex: number) => void;
  loadExistingImages: (productId: string) => Promise<void>;
  uploadAllImages: (productId: string) => Promise<string[]>;
  uploadDraftImages: (productId: string) => Promise<string[]>;
  clearDraftImages: () => void;
}

const DraftImagesContext = createContext<DraftImagesContextType | null>(null);

interface DraftImagesProviderProps {
  children: ReactNode;
}

export const DraftImagesProvider: React.FC<DraftImagesProviderProps> = ({
  children,
}) => {
  const draftImagesHook = useDraftImages();

  return (
    <DraftImagesContext.Provider value={draftImagesHook}>
      {children}
    </DraftImagesContext.Provider>
  );
};

export const useDraftImagesContext = (): DraftImagesContextType => {
  const context = useContext(DraftImagesContext);
  if (!context) {
    throw new Error(
      "useDraftImagesContext deve ser usado dentro de um DraftImagesProvider"
    );
  }
  return context;
};
