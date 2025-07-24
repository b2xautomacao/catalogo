
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle, User, Mail, Phone, MapPin, Search } from 'lucide-react';
import { useShippingCalculator } from '@/hooks/useShippingCalculator';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface EnhancedCustomerDataFormProps {
  customerData: CustomerData;
  onDataChange: (data: CustomerData) => void;
  showAddressFields?: boolean;
}

const EnhancedCustomerDataForm: React.FC<EnhancedCustomerDataFormProps> = ({ 
  customerData, 
  onDataChange,
  showAddressFields = true
}) => {
  const [fieldStatus, setFieldStatus] = useState({
    name: false,
    email: false,
    phone: false,
    zipCode: false,
    street: false,
    number: false
  });

  const { fetchAddressByZipCode, loading: zipCodeLoading } = useShippingCalculator();

  const handleChange = (field: keyof CustomerData, value: string) => {
    onDataChange({ ...customerData, [field]: value });
    
    // Validação em tempo real
    setFieldStatus(prev => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  const validateField = (field: keyof CustomerData, value: string): boolean => {
    switch (field) {
      case 'name':
        return value.trim().length >= 2;
      case 'email':
        return value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(value);
      case 'zipCode':
        return /^\d{5}-?\d{3}$/.test(value);
      case 'street':
        return value.trim().length >= 3;
      case 'number':
        return value.trim().length >= 1;
      default:
        return false;
    }
  };

  const handleZipCodeSearch = async () => {
    const zipCode = customerData.zipCode?.replace(/\D/g, '');
    if (zipCode && zipCode.length === 8) {
      try {
        const addressData = await fetchAddressByZipCode(zipCode);
        if (addressData) {
          onDataChange({
            ...customerData,
            street: addressData.street || '',
            neighborhood: addressData.neighborhood || '',
            city: addressData.city || '',
            state: addressData.state || ''
          });
          
          setFieldStatus(prev => ({
            ...prev,
            street: !!(addressData.street && addressData.street.length >= 3)
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white via-blue-50 to-purple-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold">1</span>
          </div>
          Seus Dados
          <div className="ml-auto flex gap-1">
            {Object.values(fieldStatus).filter(Boolean).length === 3 && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo *
            {fieldStatus.name && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            id="name"
            placeholder="Seu nome completo"
            value={customerData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`mt-1 transition-all ${
              fieldStatus.name 
                ? 'border-green-300 bg-green-50' 
                : customerData.name && !fieldStatus.name 
                  ? 'border-red-300 bg-red-50' 
                  : ''
            }`}
          />
          {customerData.name && !fieldStatus.name && (
            <p className="text-xs text-red-600">Nome deve ter pelo menos 2 caracteres</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp *
              {fieldStatus.phone && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              value={customerData.phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                handleChange('phone', formatted);
              }}
              className={`mt-1 transition-all ${
                fieldStatus.phone 
                  ? 'border-green-300 bg-green-50' 
                  : customerData.phone && !fieldStatus.phone 
                    ? 'border-red-300 bg-red-50' 
                    : ''
              }`}
              maxLength={15}
            />
            {customerData.phone && !fieldStatus.phone && (
              <p className="text-xs text-red-600">Formato: (11) 99999-9999</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (opcional)
              {customerData.email && fieldStatus.email && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={customerData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`mt-1 transition-all ${
                customerData.email && fieldStatus.email 
                  ? 'border-green-300 bg-green-50' 
                  : customerData.email && !fieldStatus.email 
                    ? 'border-red-300 bg-red-50' 
                    : ''
              }`}
            />
            {customerData.email && !fieldStatus.email && (
              <p className="text-xs text-red-600">Email inválido</p>
            )}
          </div>
        </div>

        {showAddressFields && (
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </h3>
            </div>

            {/* CEP */}
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-sm font-medium flex items-center gap-2">
                CEP *
                {fieldStatus.zipCode && <CheckCircle className="h-4 w-4 text-green-500" />}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="zipCode"
                  placeholder="00000-000"
                  value={customerData.zipCode || ''}
                  onChange={(e) => {
                    const formatted = formatZipCode(e.target.value);
                    handleChange('zipCode', formatted);
                  }}
                  className={`transition-all ${
                    fieldStatus.zipCode 
                      ? 'border-green-300 bg-green-50' 
                      : customerData.zipCode && !fieldStatus.zipCode 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                  }`}
                  maxLength={9}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleZipCodeSearch}
                  disabled={!fieldStatus.zipCode || zipCodeLoading}
                  className="shrink-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {customerData.zipCode && !fieldStatus.zipCode && (
                <p className="text-xs text-red-600">CEP deve ter 8 dígitos</p>
              )}
            </div>

            {/* Endereço e Número */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street" className="text-sm font-medium flex items-center gap-2">
                  Endereço *
                  {fieldStatus.street && <CheckCircle className="h-4 w-4 text-green-500" />}
                </Label>
                <Input
                  id="street"
                  placeholder="Rua, avenida, etc."
                  value={customerData.street || ''}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className={`transition-all ${
                    fieldStatus.street 
                      ? 'border-green-300 bg-green-50' 
                      : customerData.street && !fieldStatus.street 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                  }`}
                />
                {customerData.street && !fieldStatus.street && (
                  <p className="text-xs text-red-600">Endereço deve ter pelo menos 3 caracteres</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="number" className="text-sm font-medium flex items-center gap-2">
                  Número *
                  {fieldStatus.number && <CheckCircle className="h-4 w-4 text-green-500" />}
                </Label>
                <Input
                  id="number"
                  placeholder="123"
                  value={customerData.number || ''}
                  onChange={(e) => handleChange('number', e.target.value)}
                  className={`transition-all ${
                    fieldStatus.number 
                      ? 'border-green-300 bg-green-50' 
                      : customerData.number && !fieldStatus.number 
                        ? 'border-red-300 bg-red-50' 
                        : ''
                  }`}
                />
                {customerData.number && !fieldStatus.number && (
                  <p className="text-xs text-red-600">Número é obrigatório</p>
                )}
              </div>
            </div>

            {/* Complemento */}
            <div className="space-y-2">
              <Label htmlFor="complement" className="text-sm font-medium">
                Complemento (opcional)
              </Label>
              <Input
                id="complement"
                placeholder="Apartamento, bloco, etc."
                value={customerData.complement || ''}
                onChange={(e) => handleChange('complement', e.target.value)}
              />
            </div>

            {/* Bairro, Cidade, Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-sm font-medium">
                  Bairro
                </Label>
                <Input
                  id="neighborhood"
                  placeholder="Bairro"
                  value={customerData.neighborhood || ''}
                  onChange={(e) => handleChange('neighborhood', e.target.value)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  Cidade
                </Label>
                <Input
                  id="city"
                  placeholder="Cidade"
                  value={customerData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  Estado
                </Label>
                <Input
                  id="state"
                  placeholder="UF"
                  value={customerData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  readOnly
                  className="bg-gray-50"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> Após confirmar, você será redirecionado para o WhatsApp da loja automaticamente 
            para finalizar seu pedido.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCustomerDataForm;
