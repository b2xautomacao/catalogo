
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        outline:
          "border border-input bg-background text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        ghost: "text-foreground",
        link: "text-primary underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      // Formato/elevação do botão — reflete a preferência de estilo do lojista
      // (`storeSettings.button_style`). Substitui o antigo `ButtonStyleProvider`,
      // que escrevia variáveis CSS que nenhum stylesheet consumia. Opcional: sem
      // `shape`, o botão mantém a aparência atual — usado explicitamente pelos
      // componentes do catálogo público (Header/Hero) para não afetar o admin.
      shape: {
        modern: "rounded-lg shadow-card hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 active:shadow-card",
        flat: "rounded-md shadow-none",
        rounded: "rounded-full shadow-card hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 active:shadow-card",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
