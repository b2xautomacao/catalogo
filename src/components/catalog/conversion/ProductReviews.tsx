import React from "react";
import { Star, Users, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductReviewsProps {
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  showStars?: boolean;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  rating = 0,
  reviewCount = 0,
  salesCount = 0,
  showStars = true,
  showCount = true,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const renderStars = () => {
    if (!showStars || rating === 0) return null;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSizes[size]} ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className={`${sizeClasses[size]} text-gray-600 ml-1`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderCounts = () => {
    if (!showCount) return null;

    return (
      <div className="flex items-center gap-3 text-gray-500">
        {reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <Users className={iconSizes[size]} />
            <span className={sizeClasses[size]}>{reviewCount} avaliações</span>
          </div>
        )}
        {salesCount > 0 && (
          <div className="flex items-center gap-1">
            <ThumbsUp className={iconSizes[size]} />
            <span className={sizeClasses[size]}>{salesCount}+ vendidos</span>
          </div>
        )}
      </div>
    );
  };

  if (rating === 0 && reviewCount === 0 && salesCount === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {renderStars()}
      {renderCounts()}
    </div>
  );
};

export default ProductReviews;
