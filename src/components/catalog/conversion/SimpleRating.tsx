/**
 * SimpleRating - Exibição Simples de Rating
 * Mostra estrelas e número de avaliações
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface SimpleRatingProps {
  rating: number;
  reviewCount?: number;
  showDistribution?: boolean;
}

const SimpleRating: React.FC<SimpleRatingProps> = ({
  rating,
  reviewCount = 0,
  showDistribution = false,
}) => {
  const ratingDistribution = {
    5: 90,
    4: 7,
    3: 2,
    2: 1,
    1: 0,
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/30">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Rating Principal */}
          <div className="text-center sm:text-left">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-600">
              {rating.toFixed(1)}
            </div>
            <div className="flex gap-1 my-2 justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    star <= Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-yellow-700">
              Excelente
            </div>
            {reviewCount > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                {reviewCount} avaliações
              </div>
            )}
          </div>

          {/* Distribuição (se habilitado) */}
          {showDistribution && (
            <>
              <div className="hidden sm:block w-px h-20 bg-gray-300" />
              <div className="w-full sm:flex-1 space-y-1.5 sm:space-y-2">
                {Object.entries(ratingDistribution).map(([stars, percentage]) => (
                  <div key={stars} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <div className="w-14 sm:w-16 text-gray-700 flex-shrink-0">{stars} estrelas</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                      {/* <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      /> */}
                    </div>
                    <div className="w-8 sm:w-12 text-gray-600 text-right flex-shrink-0">{percentage}%</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleRating;

