
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';

interface BusinessHour {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHours {
  monday?: BusinessHour;
  tuesday?: BusinessHour;
  wednesday?: BusinessHour;
  thursday?: BusinessHour;
  friday?: BusinessHour;
  saturday?: BusinessHour;
  sunday?: BusinessHour;
}

interface BusinessHoursCardProps {
  businessHours: BusinessHours;
  onUpdate: (hours: BusinessHours) => void;
}

const BusinessHoursCard: React.FC<BusinessHoursCardProps> = ({
  businessHours,
  onUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira', short: 'Seg' },
    { key: 'tuesday', label: 'Terça-feira', short: 'Ter' },
    { key: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
    { key: 'thursday', label: 'Quinta-feira', short: 'Qui' },
    { key: 'friday', label: 'Sexta-feira', short: 'Sex' },
    { key: 'saturday', label: 'Sábado', short: 'Sáb' },
    { key: 'sunday', label: 'Domingo', short: 'Dom' }
  ];

  const getDefaultHour = (): BusinessHour => ({
    open: '09:00',
    close: '18:00',
    closed: false
  });

  const handleDayUpdate = (day: string, updates: Partial<BusinessHour>) => {
    const currentHour = businessHours[day as keyof BusinessHours] || getDefaultHour();
    const updatedHours = {
      ...businessHours,
      [day]: { ...currentHour, ...updates }
    };
    onUpdate(updatedHours);
  };

  const toggleAllDays = (closed: boolean) => {
    const updatedHours: BusinessHours = {};
    daysOfWeek.forEach(day => {
      updatedHours[day.key as keyof BusinessHours] = {
        ...(businessHours[day.key as keyof BusinessHours] || getDefaultHour()),
        closed
      };
    });
    onUpdate(updatedHours);
  };

  if (isMobile) {
    return (
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Horário de Funcionamento</CardTitle>
                    <p className="text-sm text-gray-600">
                      Configure os horários da sua loja
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Ações rápidas */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllDays(false)}
                  className="flex-1"
                >
                  Abrir Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllDays(true)}
                  className="flex-1"
                >
                  Fechar Todos
                </Button>
              </div>

              {/* Dias da semana */}
              <div className="space-y-4">
                {daysOfWeek.map((day) => {
                  const dayHours = businessHours[day.key as keyof BusinessHours] || getDefaultHour();
                  
                  return (
                    <div key={day.key} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="font-medium text-gray-900">
                          {day.label}
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {dayHours.closed ? 'Fechado' : 'Aberto'}
                          </span>
                          <Switch
                            checked={!dayHours.closed}
                            onCheckedChange={(checked) => 
                              handleDayUpdate(day.key, { closed: !checked })
                            }
                          />
                        </div>
                      </div>
                      
                      {!dayHours.closed && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              Abertura
                            </Label>
                            <Input
                              type="time"
                              value={dayHours.open}
                              onChange={(e) => 
                                handleDayUpdate(day.key, { open: e.target.value })
                              }
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              Fechamento
                            </Label>
                            <Input
                              type="time"
                              value={dayHours.close}
                              onChange={(e) => 
                                handleDayUpdate(day.key, { close: e.target.value })
                              }
                              className="h-10"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  // Desktop layout
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>Horário de Funcionamento</CardTitle>
            <p className="text-sm text-gray-600">
              Configure os horários da sua loja
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Ações rápidas */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllDays(false)}
          >
            Abrir Todos os Dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllDays(true)}
          >
            Fechar Todos os Dias
          </Button>
        </div>

        {/* Grid dos dias */}
        <div className="grid gap-4">
          {daysOfWeek.map((day) => {
            const dayHours = businessHours[day.key as keyof BusinessHours] || getDefaultHour();
            
            return (
              <div key={day.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-24">
                  <Label className="font-medium">{day.label}</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!dayHours.closed}
                    onCheckedChange={(checked) => 
                      handleDayUpdate(day.key, { closed: !checked })
                    }
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {dayHours.closed ? 'Fechado' : 'Aberto'}
                  </span>
                </div>
                
                {!dayHours.closed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Abertura:</Label>
                      <Input
                        type="time"
                        value={dayHours.open}
                        onChange={(e) => 
                          handleDayUpdate(day.key, { open: e.target.value })
                        }
                        className="w-24"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Fechamento:</Label>
                      <Input
                        type="time"
                        value={dayHours.close}
                        onChange={(e) => 
                          handleDayUpdate(day.key, { close: e.target.value })
                        }
                        className="w-24"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessHoursCard;
