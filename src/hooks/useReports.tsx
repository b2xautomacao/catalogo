
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export interface ProductMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export interface StockMetrics {
  totalMovements: number;
  reservedStock: number;
  recentMovements: Array<{
    id: string;
    product_name: string;
    movement_type: string;
    quantity: number;
    created_at: string;
  }>;
}

export interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  revenue: number;
}

export const useReports = (dateRange: string = '30d') => {
  const { profile } = useAuth();

  // Função para calcular range de datas
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { from: subDays(now, 7), to: now };
      case '30d':
        return { from: subDays(now, 30), to: now };
      case '90d':
        return { from: subDays(now, 90), to: now };
      case '1y':
        return { from: subDays(now, 365), to: now };
      default:
        return { from: subDays(now, 30), to: now };
    }
  };

  // Buscar métricas de vendas
  const fetchSalesMetrics = async (): Promise<SalesMetrics> => {
    if (!profile?.store_id) throw new Error('Store ID não encontrado');

    const { from, to } = getDateRange();
    const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));

    console.log('Buscando métricas de vendas para:', profile.store_id);

    // Vendas do período atual
    const { data: currentSales, error: currentError } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('store_id', profile.store_id)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .in('status', ['confirmed', 'shipping', 'delivered']);

    if (currentError) throw currentError;

    // Vendas do período anterior (para comparação)
    const { data: previousSales, error: previousError } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('store_id', profile.store_id)
      .gte('created_at', previousFrom.toISOString())
      .lt('created_at', from.toISOString())
      .in('status', ['confirmed', 'shipping', 'delivered']);

    if (previousError) throw previousError;

    const currentRevenue = currentSales.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const currentOrders = currentSales.length;
    const avgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    const previousRevenue = previousSales.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const previousOrders = previousSales.length;

    const revenueGrowth = previousRevenue > 0 ? 
      ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const ordersGrowth = previousOrders > 0 ? 
      ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

    return {
      totalRevenue: currentRevenue,
      totalOrders: currentOrders,
      avgOrderValue,
      revenueGrowth,
      ordersGrowth
    };
  };

  // Buscar métricas de produtos
  const fetchProductMetrics = async (): Promise<ProductMetrics> => {
    if (!profile?.store_id) throw new Error('Store ID não encontrado');

    console.log('Buscando métricas de produtos para:', profile.store_id);

    // Produtos básicos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock, reserved_stock, stock_alert_threshold')
      .eq('store_id', profile.store_id)
      .eq('is_active', true);

    if (productsError) throw productsError;

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => {
      const availableStock = p.stock - (p.reserved_stock || 0);
      const threshold = p.stock_alert_threshold || 5;
      return availableStock <= threshold && availableStock > 0;
    }).length;
    
    const outOfStockProducts = products.filter(p => {
      const availableStock = p.stock - (p.reserved_stock || 0);
      return availableStock <= 0;
    }).length;

    // Top produtos vendidos (baseado em movimentações de venda)
    const { data: topProducts, error: topError } = await supabase
      .from('stock_movements')
      .select(`
        product_id,
        quantity,
        products!inner(name)
      `)
      .eq('store_id', profile.store_id)
      .eq('movement_type', 'sale')
      .gte('created_at', getDateRange().from.toISOString());

    if (topError) throw topError;

    // Agregar vendas por produto
    const productSales = topProducts.reduce((acc, movement) => {
      const productId = movement.product_id;
      const productName = movement.products?.name || 'Produto sem nome';
      
      if (!acc[productId]) {
        acc[productId] = { id: productId, name: productName, sales: 0, revenue: 0 };
      }
      acc[productId].sales += movement.quantity;
      // Para calcular receita precisaríamos do preço no momento da venda
      // Por enquanto vamos usar a quantidade como métrica principal
      return acc;
    }, {} as Record<string, { id: string; name: string; sales: number; revenue: number }>);

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      topSellingProducts
    };
  };

  // Buscar métricas de estoque
  const fetchStockMetrics = async (): Promise<StockMetrics> => {
    if (!profile?.store_id) throw new Error('Store ID não encontrado');

    console.log('Buscando métricas de estoque para:', profile.store_id);

    const { from } = getDateRange();

    // Movimentações recentes
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select(`
        id,
        movement_type,
        quantity,
        created_at,
        products!inner(name)
      `)
      .eq('store_id', profile.store_id)
      .gte('created_at', from.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (movementsError) throw movementsError;

    // Total de estoque reservado
    const { data: reservedStock, error: reservedError } = await supabase
      .from('products')
      .select('reserved_stock')
      .eq('store_id', profile.store_id);

    if (reservedError) throw reservedError;

    const totalReservedStock = reservedStock.reduce((sum, product) => 
      sum + (product.reserved_stock || 0), 0);

    const recentMovements = movements.map(movement => ({
      id: movement.id,
      product_name: movement.products?.name || 'Produto sem nome',
      movement_type: movement.movement_type,
      quantity: movement.quantity,
      created_at: movement.created_at
    }));

    return {
      totalMovements: movements.length,
      reservedStock: totalReservedStock,
      recentMovements
    };
  };

  // Buscar dados de vendas por período
  const fetchSalesData = async (): Promise<SalesData[]> => {
    if (!profile?.store_id) throw new Error('Store ID não encontrado');

    console.log('Buscando dados de vendas por período para:', profile.store_id);

    const { from, to } = getDateRange();

    const { data: sales, error } = await supabase
      .from('orders')
      .select('total_amount, created_at, customer_email')
      .eq('store_id', profile.store_id)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .in('status', ['confirmed', 'shipping', 'delivered']);

    if (error) throw error;

    // Agrupar por período (mensal para 90d+, semanal para 30d-, diário para 7d-)
    const groupBy = dateRange === '7d' ? 'day' : 
                    dateRange === '30d' ? 'week' : 'month';

    const groupedData: Record<string, { revenue: number; orders: number; customers: Set<string> }> = {};

    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      let key: string;

      if (groupBy === 'day') {
        key = format(date, 'dd/MM');
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = format(weekStart, 'dd/MM');
      } else {
        key = format(date, 'MMM');
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, orders: 0, customers: new Set() };
      }

      groupedData[key].revenue += Number(sale.total_amount);
      groupedData[key].orders += 1;
      if (sale.customer_email) {
        groupedData[key].customers.add(sale.customer_email);
      }
    });

    return Object.entries(groupedData).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orders: data.orders,
      customers: data.customers.size
    }));
  };

  // Buscar distribuição por categorias
  const fetchCategoryDistribution = async (): Promise<CategoryDistribution[]> => {
    if (!profile?.store_id) throw new Error('Store ID não encontrado');

    console.log('Buscando distribuição por categorias para:', profile.store_id);

    const { data: products, error } = await supabase
      .from('products')
      .select('category, retail_price')
      .eq('store_id', profile.store_id)
      .eq('is_active', true);

    if (error) throw error;

    const categoryData: Record<string, { value: number; revenue: number }> = {};

    products.forEach(product => {
      const category = product.category || 'Sem categoria';
      if (!categoryData[category]) {
        categoryData[category] = { value: 0, revenue: 0 };
      }
      categoryData[category].value += 1;
      categoryData[category].revenue += Number(product.retail_price);
    });

    return Object.entries(categoryData).map(([name, data]) => ({
      name,
      value: data.value,
      revenue: data.revenue
    }));
  };

  // Queries
  const salesMetricsQuery = useQuery({
    queryKey: ['salesMetrics', profile?.store_id, dateRange],
    queryFn: fetchSalesMetrics,
    enabled: !!profile?.store_id,
    refetchOnWindowFocus: false
  });

  const productMetricsQuery = useQuery({
    queryKey: ['productMetrics', profile?.store_id],
    queryFn: fetchProductMetrics,
    enabled: !!profile?.store_id,
    refetchOnWindowFocus: false
  });

  const stockMetricsQuery = useQuery({
    queryKey: ['stockMetrics', profile?.store_id, dateRange],
    queryFn: fetchStockMetrics,
    enabled: !!profile?.store_id,
    refetchOnWindowFocus: false
  });

  const salesDataQuery = useQuery({
    queryKey: ['salesData', profile?.store_id, dateRange],
    queryFn: fetchSalesData,
    enabled: !!profile?.store_id,
    refetchOnWindowFocus: false
  });

  const categoryDistributionQuery = useQuery({
    queryKey: ['categoryDistribution', profile?.store_id],
    queryFn: fetchCategoryDistribution,
    enabled: !!profile?.store_id,
    refetchOnWindowFocus: false
  });

  return {
    // Dados
    salesMetrics: salesMetricsQuery.data,
    productMetrics: productMetricsQuery.data,
    stockMetrics: stockMetricsQuery.data,
    salesData: salesDataQuery.data || [],
    categoryDistribution: categoryDistributionQuery.data || [],
    
    // Estados de loading
    isLoadingSales: salesMetricsQuery.isLoading,
    isLoadingProducts: productMetricsQuery.isLoading,
    isLoadingStock: stockMetricsQuery.isLoading,
    isLoadingSalesData: salesDataQuery.isLoading,
    isLoadingCategories: categoryDistributionQuery.isLoading,
    
    // Funções de refetch
    refetchAll: () => {
      salesMetricsQuery.refetch();
      productMetricsQuery.refetch();
      stockMetricsQuery.refetch();
      salesDataQuery.refetch();
      categoryDistributionQuery.refetch();
    }
  };
};
