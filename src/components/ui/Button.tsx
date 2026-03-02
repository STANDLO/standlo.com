import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "ui-btn",
    {
        variants: {
            variant: {
                primary: "bg-primary text-primary-foreground focus-visible:ring-ring hover:bg-primary/90",
                primaryMuted: "bg-primary/20 text-primary-foreground/80 focus-visible:ring-ring cursor-not-allowed",
                primaryReadonly: "bg-primary text-primary-foreground opacity-50 focus-visible:ring-ring cursor-default pointer-events-none",
                secondary: "bg-secondary text-secondary-foreground focus-visible:ring-secondary hover:bg-secondary/80",
                secondaryMuted: "bg-secondary/20 text-secondary-foreground/80 focus-visible:ring-secondary cursor-not-allowed",
                secondaryReadonly: "bg-secondary text-secondary-foreground opacity-50 focus-visible:ring-secondary cursor-default pointer-events-none",
                outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground text-foreground",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "primary",
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
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
