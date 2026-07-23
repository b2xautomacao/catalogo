/**
 * SocialProofTestimonials - Depoimentos e Provas Sociais Cadastradas
 * Exibe depoimentos reais de clientes cadastrados no sistema
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, MapPin, Calendar, CheckCircle } from "lucide-react";

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_city: string;
  customer_state?: string;
  customer_avatar?: string;
  rating: number;
  comment: string;
  purchase_date: string;
  verified_purchase: boolean;
  helpful_count?: number;
}

interface SocialProofTestimonialsProps {
  testimonials: Testimonial[];
  maxDisplay?: number;
}

const SocialProofTestimonials: React.FC<SocialProofTestimonialsProps> = ({
  testimonials,
  maxDisplay = 3,
}) => {
  if (!testimonials || testimonials.length === 0) return null;

  const displayTestimonials = testimonials.slice(0, maxDisplay);

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Quote className="w-5 h-5 text-orange-600" />
            O que nossos clientes dizem
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            {testimonials.length} avaliações
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {displayTestimonials.map((testimonial) => (
          <div 
            key={testimonial.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            {/* Header do depoimento */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={testimonial.customer_avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {getInitials(testimonial.customer_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {testimonial.customer_name}
                      {testimonial.verified_purchase && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Compra Verificada
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.customer_city}
                      {testimonial.customer_state && `, ${testimonial.customer_state}`}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">
                    {testimonial.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Comentário */}
            <p className="text-gray-700 leading-relaxed mb-3 italic">
              "{testimonial.comment}"
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(testimonial.purchase_date)}
              </div>
              {testimonial.helpful_count && testimonial.helpful_count > 0 && (
                <div className="text-gray-600">
                  {testimonial.helpful_count} {testimonial.helpful_count === 1 ? 'pessoa achou' : 'pessoas acharam'} útil
                </div>
              )}
            </div>
          </div>
        ))}

        {testimonials.length > maxDisplay && (
          <button className="w-full text-center text-blue-600 hover:text-blue-700 font-semibold py-2 hover:bg-blue-50 rounded-lg transition-colors">
            Ver todas as {testimonials.length} avaliações →
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialProofTestimonials;

