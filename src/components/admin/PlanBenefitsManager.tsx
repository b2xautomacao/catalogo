
import React from 'react';
import { PlanBenefitsToggleList } from '@/components/admin/PlanBenefitsToggleList';

interface PlanBenefitsManagerProps {
  planId: string;
  planName: string;
}

export const PlanBenefitsManager: React.FC<PlanBenefitsManagerProps> = ({
  planId,
  planName
}) => {
  return (
    <PlanBenefitsToggleList 
      planId={planId}
      planName={planName}
    />
  );
};
