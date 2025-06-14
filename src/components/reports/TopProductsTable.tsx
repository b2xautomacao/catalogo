
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Trophy } from 'lucide-react';
import { ProductMetrics } from '@/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';

interface TopProductsTableProps {
  productMetrics?: ProductMetrics;
  isLoading: boolean;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ productMetrics, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topProducts = productMetrics?.topSellingProducts || [];

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-600" />
          Produtos Mais Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topProducts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sem vendas registradas
            </h3>
            <p className="text-gray-600">
              Ainda não há produtos vendidos para exibir o ranking.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {index === 0 && <Badge variant="default" className="bg-yellow-500">🥇</Badge>}
                      {index === 1 && <Badge variant="secondary" className="bg-gray-400">🥈</Badge>}
                      {index === 2 && <Badge variant="outline" className="border-orange-400">🥉</Badge>}
                      {index > 2 && <span className="text-muted-foreground">{index + 1}º</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {product.id.substring(0, 8)}...</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {product.sales} unidades
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProductsTable;
