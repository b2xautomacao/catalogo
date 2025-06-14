
import { usePlanPermissions } from './usePlanPermissions';
import { useFeatureUsageMonitor } from './useFeatureUsageMonitor';
import { useState } from 'react';
import { toast } from 'sonner';

export const useImageUploadControl = () => {
  const { checkFeatureAccess, getFeatureDisplayInfo } = usePlanPermissions();
  const { checkFeatureUsage, incrementUsage } = useFeatureUsageMonitor();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const canUploadImage = async (): Promise<boolean> => {
    // Verificar se tem acesso à funcionalidade
    if (!checkFeatureAccess('max_images_per_product', false)) {
      setShowUpgradeModal(true);
      return false;
    }

    // Verificar limite de uso
    if (!checkFeatureUsage('max_images_per_product')) {
      setShowUpgradeModal(true);
      return false;
    }

    return true;
  };

  const recordImageUpload = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await incrementUsage('max_images_per_product', 1);
      
      if (!result.success) {
        toast.error('Limite de imagens atingido para este produto');
        setShowUpgradeModal(true);
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar upload de imagem:', error);
      return { success: false, error: 'Erro interno' };
    }
  };

  const getImageLimitInfo = () => {
    const featureName = getFeatureDisplayInfo('max_images_per_product');
    return {
      featureName,
      showUpgradeModal,
      setShowUpgradeModal
    };
  };

  return {
    canUploadImage,
    recordImageUpload,
    getImageLimitInfo,
    showUpgradeModal,
    setShowUpgradeModal
  };
};
