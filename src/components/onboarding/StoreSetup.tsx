
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Store, Sparkles } from 'lucide-react';

const StoreSetup = () => {
  const { profile, createStoreForUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    
    const { error } = await createStoreForUser(
      profile.id,
      formData.name,
      formData.description
    );

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar sua loja. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Sua loja foi criada com sucesso!",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md card-modern">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl gradient-text">Configure Sua Loja</CardTitle>
          <p className="text-muted-foreground">
            Vamos criar sua loja para você começar a vender
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Loja *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Minha Loja Online"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva sua loja e produtos..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full btn-primary"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando Loja...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Criar Minha Loja
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">O que você receberá:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Catálogo online personalizado</li>
              <li>• Gestão completa de produtos</li>
              <li>• Sistema de pedidos integrado</li>
              <li>• Configurações de pagamento e entrega</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreSetup;
