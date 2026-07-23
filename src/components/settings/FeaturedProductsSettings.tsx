import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Star, GalleryHorizontal, LayoutTemplate } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

const FEATURED_SOFT_LIMIT = 12;

interface FeaturedProductsSettingsProps {
  settings: any;
  onUpdate: (field: string, value: any) => void;
}

const FeaturedProductsSettings: React.FC<FeaturedProductsSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  const { products } = useProducts();
  const featuredCount = products.filter((p) => p.is_featured).length;
  const style = settings.featured_products_style || "carousel";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Produtos em Destaque
          </CardTitle>
          <CardDescription>
            Exiba uma seção com os produtos marcados como destaque na listagem de produtos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle Master */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <Label htmlFor="featured-products-enabled">
                Exibir seção de destaque no catálogo
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Aparece logo após o banner principal, acima da grade de produtos
              </p>
            </div>
            <Switch
              id="featured-products-enabled"
              checked={settings.featured_products_enabled !== false}
              onCheckedChange={(checked) =>
                onUpdate("featured_products_enabled", checked)
              }
            />
          </div>

          {/* Contador de produtos destacados */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Produtos marcados como destaque
            </span>
            <Badge
              variant="outline"
              className={
                featuredCount > FEATURED_SOFT_LIMIT
                  ? "border-amber-400 text-amber-700 bg-amber-50"
                  : "border-yellow-300 text-yellow-700 bg-yellow-50"
              }
            >
              <Star className="h-3 w-3 mr-1" fill="currentColor" />
              {featuredCount}
            </Badge>
          </div>
          {featuredCount === 0 && (
            <p className="text-xs text-gray-500">
              Marque produtos como destaque clicando na estrela ⭐ na listagem de produtos.
            </p>
          )}
          {featuredCount > FEATURED_SOFT_LIMIT && (
            <p className="text-xs text-amber-600">
              Recomendamos até {FEATURED_SOFT_LIMIT} produtos em destaque para manter a vitrine
              organizada. Apenas os {FEATURED_SOFT_LIMIT} mais recentes serão exibidos.
            </p>
          )}

          {/* Estilo de exibição */}
          <div className="space-y-3">
            <Label>Estilo da seção</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdate("featured_products_style", "hero")}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors ${
                  style === "hero"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <LayoutTemplate className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Hero</p>
                  <p className="text-xs text-gray-500">
                    Banner full-width, um produto em destaque por vez, com rotação automática
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdate("featured_products_style", "carousel")}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors ${
                  style === "carousel"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <GalleryHorizontal className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Cards Carrossel</p>
                  <p className="text-xs text-gray-500">
                    Vários produtos lado a lado, com navegação por arraste/setas
                  </p>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturedProductsSettings;
