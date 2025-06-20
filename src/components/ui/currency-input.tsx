
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("")

    React.useEffect(() => {
      if (value === 0) {
        setDisplayValue("")
      } else {
        setDisplayValue(formatCurrency(value))
      }
    }, [value])

    const formatCurrency = (num: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(num).replace('R$', '').trim()
    }

    const parseCurrency = (str: string): number => {
      const numbers = str.replace(/[^\d,]/g, '').replace(',', '.')
      return parseFloat(numbers) || 0
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      const numericValue = parseCurrency(rawValue)
      
      setDisplayValue(rawValue)
      onChange(numericValue)
    }

    const handleBlur = () => {
      if (value > 0) {
        setDisplayValue(formatCurrency(value))
      }
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          className={cn("pl-10", className)}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0,00"
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
