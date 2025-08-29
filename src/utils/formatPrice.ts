
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};
