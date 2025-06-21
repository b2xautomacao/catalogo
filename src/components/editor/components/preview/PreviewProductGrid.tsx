
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { ShoppingCart, Star } from 'lucide-react';

const PreviewProductGrid: React.FC = () => {
  const { configuration, currentDevice } = useEditorStore();
  const productConfig = configuration.productCards;

  const getColumnsClass = () => {
    const columns = productConfig.columns[currentDevice];
    return `grid-cols-${columns}`;
  };

  const mockProducts = [
    { id: 1, name: 'Produto Exemplo 1', price: 99.90, discount: 10, image: 'https://via.placeholder.com/300x300' },
    { id: 2, name: 'Produto Exemplo 2', price: 149.90, discount: 0, image: 'https://via.placeholder.com/300x300' },
    { id: 3, name: 'Produto Exemplo 3', price: 79.90, discount: 15, image: 'https://via.placeholder.com/300x300' },
    { id: 4, name: 'Produto Exemplo 4', price: 199.90, discount: 20, image: 'https://via.placeholder.com/300x300' },
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Produtos em Destaque</h2>
        
        <div className={`grid ${getColumnsClass()} gap-6`}>
          {mockProducts.map((product) => (
            <div
              key={product.id}
              className={`${productConfig.showBorder ? 'border' : ''} rounded-lg overflow-hidden hover:shadow-lg transition-shadow`}
              style={{
                backgroundColor: productConfig.backgroundColor,
                borderColor: productConfig.borderColor,
              }}
            >
              {/* Imagem do produto */}
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {productConfig.showElements.discountBadge && product.discount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    -{product.discount}%
                  </span>
                )}
              </div>

              {/* Conteúdo do card */}
              <div className="p-4">
                {productConfig.showElements.title && (
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                )}

                {productConfig.showElements.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    Descrição do produto com detalhes sobre suas características e benefícios.
                  </p>
                )}

                {/* Avaliação */}
                <div className="flex items-center mb-3">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">(4.5)</span>
                </div>

                {/* Preço */}
                {productConfig.showElements.price && (
                  <div className="mb-4">
                    {product.discount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-green-600">
                          R$ {(product.price * (1 - product.discount / 100)).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold">
                        R$ {product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {/* Botão de compra */}
                {productConfig.showElements.buyButton && (
                  <button
                    className="w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: productConfig.buttonStyle.backgroundColor,
                      color: productConfig.buttonStyle.textColor,
                      borderRadius: `${productConfig.buttonStyle.borderRadius}px`,
                    }}
                  >
                    <ShoppingCart size={16} />
                    Adicionar ao Carrinho
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PreviewProductGrid;
