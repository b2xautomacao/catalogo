
import React from 'react';
import { Shirt, Watch, Smartphone, Home, Car, Book } from 'lucide-react';

const PreviewCategories: React.FC = () => {
  const categories = [
    { id: 1, name: 'Roupas', icon: Shirt, color: 'bg-pink-100 text-pink-600' },
    { id: 2, name: 'Relógios', icon: Watch, color: 'bg-blue-100 text-blue-600' },
    { id: 3, name: 'Eletrônicos', icon: Smartphone, color: 'bg-purple-100 text-purple-600' },
    { id: 4, name: 'Casa', icon: Home, color: 'bg-green-100 text-green-600' },
    { id: 5, name: 'Automóveis', icon: Car, color: 'bg-orange-100 text-orange-600' },
    { id: 6, name: 'Livros', icon: Book, color: 'bg-indigo-100 text-indigo-600' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Nossas Categorias
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <IconComponent size={24} />
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PreviewCategories;
