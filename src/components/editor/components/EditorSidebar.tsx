import React, { useState } from 'react';
import { Settings, Layout, Package, ShoppingCart, Grid3X3 } from 'lucide-react';
import GlobalSettings from './settings/GlobalSettings';
import HeaderSettings from './settings/HeaderSettings';
import ProductCardSettings from './settings/ProductCardSettings';
import CheckoutSettings from './settings/CheckoutSettings';
import SectionsManager from './settings/SectionsManager';

const EditorSidebar: React.FC = () => {
  const [activeSection, setActiveSection] = useState('global');

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 p-4">
        <nav className="flex flex-col space-y-1">
          {[
            { id: 'global', label: 'Global', icon: Settings },
            { id: 'header', label: 'Cabeçalho', icon: Layout },
            { id: 'products', label: 'Produtos', icon: Package },
            { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
            { id: 'sections', label: 'Seções', icon: Grid3X3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeSection === id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'global'&& <GlobalSettings />}
        {activeSection === 'header' && <HeaderSettings />}
        {activeSection === 'products' && <ProductCardSettings />}
        {activeSection === 'checkout' && <CheckoutSettings />}
        {activeSection === 'sections' && <SectionsManager />}
      </div>
    </div>
  );
};

export default EditorSidebar;
