
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductDescriptionAI from "@/components/ai/ProductDescriptionAI";

interface ProductBasicInfoFormProps {
  name: string;
  description: string;
  category: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onCategoryChange: (category: string) => void;
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({
  name,
  description,
  category,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
}) => {
  const categories = [
    "Eletrônicos",
    "Roupas e Acessórios",
    "Casa e Jardim",
    "Esportes e Lazer",
    "Beleza e Cuidados Pessoais",
    "Livros e Mídia",
    "Brinquedos e Jogos",
    "Automotivo",
    "Alimentação",
    "Outros"
  ];

  const handleAIDescriptionGenerated = (generatedDescription: string) => {
    onDescriptionChange(generatedDescription);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas do Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome do Produto */}
          <div className="space-y-2">
            <Label htmlFor="product-name">
              Nome do Produto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="Digite o nome do produto"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="product-category">Categoria</Label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição com IA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="product-description">Descrição do Produto</Label>
              {name.trim() && (
                <ProductDescriptionAI
                  productName={name}
                  category={category}
                  onDescriptionGenerated={handleAIDescriptionGenerated}
                />
              )}
            </div>
            <Textarea
              id="product-description"
              placeholder="Descreva os detalhes, características e benefícios do produto"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={4}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Uma boa descrição ajuda os clientes a entenderem melhor o produto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductBasicInfoForm;
