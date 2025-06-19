
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrdersTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  counts: {
    all: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
  };
  children: React.ReactNode;
}

const OrdersTabs: React.FC<OrdersTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
  children
}) => {
  const isMobile = useIsMobile();

  const tabItems = [
    { value: 'all', label: 'Todos', count: counts.all },
    { value: 'pending', label: 'Pendentes', count: counts.pending },
    { value: 'confirmed', label: 'Confirmados', count: counts.confirmed },
    { value: 'shipped', label: 'Enviados', count: counts.shipped },
    { value: 'delivered', label: 'Entregues', count: counts.delivered }
  ];

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile: Dropdown-style selector */}
        <div className="bg-white rounded-lg border p-2">
          <div className="grid grid-cols-2 gap-2">
            {tabItems.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`
                  flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.value 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="truncate">{tab.label}</span>
                <Badge 
                  variant={activeTab === tab.value ? "secondary" : "outline"}
                  className="ml-2 text-xs"
                >
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 h-auto p-1">
        {tabItems.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value}
            className="flex items-center gap-2 py-2 px-3 data-[state=active]:bg-white"
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label.slice(0, 4)}</span>
            <Badge variant="secondary" className="text-xs">
              {tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  );
};

export default OrdersTabs;
