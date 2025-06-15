
import React from 'react';
import { BenefitGate } from '@/components/billing/BenefitGate';
import AppLayout from '@/components/layout/AppLayout';
import ReportCards from '@/components/reports/ReportCards';
import SalesChart from '@/components/reports/SalesChart';
import TopProductsTable from '@/components/reports/TopProductsTable';

const ProtectedReports = () => {
  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Relatórios', current: true }
  ];

  return (
    <AppLayout 
      title="Relatórios"
      subtitle="Análises detalhadas do seu negócio"
      breadcrumbs={breadcrumbs}
    >
      <BenefitGate 
        benefitKey="dedicated_support"
        customMessage="Os relatórios avançados estão disponíveis apenas no plano Premium. Obtenha insights valiosos do seu negócio!"
      >
        <div className="space-y-6">
          <ReportCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesChart />
            <TopProductsTable />
          </div>
        </div>
      </BenefitGate>
    </AppLayout>
  );
};

export default ProtectedReports;
