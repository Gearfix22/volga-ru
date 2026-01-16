import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 shadow-sm hover:shadow-md",
        outline:
          "border-2 border-input bg-transparent text-foreground hover:bg-accent/10 active:bg-accent/20 hover:border-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent/10 active:bg-accent/20 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        success: "bg-success text-success-foreground hover:bg-success/90 active:bg-success/80 shadow-sm hover:shadow-md",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80 shadow-sm hover:shadow-md",
        premium: "bg-gradient-to-r from-primary via-accent to-secondary text-white hover:opacity-90 active:opacity-80 shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-11 min-h-[44px] px-5 py-2.5",
        sm: "h-9 min-h-[36px] rounded-md px-3.5 text-xs",
        lg: "h-12 min-h-[48px] rounded-lg px-8 text-base",
        xl: "h-14 min-h-[56px] rounded-lg px-10 text-lg",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
