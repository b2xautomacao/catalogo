import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { CatalogPreview } from './CatalogPreview';
import { CheckoutPreview } from './CheckoutPreview';

const EditorPreview: React.FC = () => {
  const { activeTab, setActiveTab } = useEditorStore();

  return (
    <div className="h-full flex flex-col">
      {/* Preview Tabs */}
      <div className="border-b border-gray-200 px-4 py-2">
        <div className="flex gap-2">
          {[
            { id: 'catalog', label: 'Catálogo' },
            { id: 'checkout', label: 'Checkout' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === id 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'catalog' && (
          <div className="p-4">
            <CatalogPreview />
          </div>
        )}
        
        {activeTab === 'checkout' && (
          <div className="p-4">
            <CheckoutPreview />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPreview;
