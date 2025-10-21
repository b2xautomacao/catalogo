import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UrgencyTimerProps {
  endTime: Date;
  onExpire?: () => void;
  showIcon?: boolean;
  variant?: "default" | "destructive" | "warning";
}

const UrgencyTimer: React.FC<UrgencyTimerProps> = ({
  endTime,
  onExpire,
  showIcon = true,
  variant = "destructive",
}) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          hours,
          minutes,
          seconds,
          total: difference,
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        onExpire?.();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (timeLeft.total <= 0) {
    return null;
  }

  const getVariantClasses = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-500 text-white animate-pulse";
      case "warning":
        return "bg-orange-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  return (
    <Badge className={`${getVariantClasses()} font-mono text-sm px-3 py-1`}>
      {showIcon && <Clock className="h-3 w-3 mr-1" />}
      <span>
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </Badge>
  );
};

export default UrgencyTimer;
