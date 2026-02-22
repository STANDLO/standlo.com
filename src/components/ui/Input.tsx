import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
    "ui-input",
    {
        variants: {
            variant: {
                primary: "ui-input-primary",
                primaryMuted: "ui-input-primary-muted",
                primaryReadonly: "ui-input-primary-readonly",
                secondary: "ui-input-secondary",
                secondaryMuted: "ui-input-secondary-muted",
                secondaryReadonly: "ui-input-secondary-readonly",
            }
        },
        defaultVariants: {
            variant: "primary",
        },
    }
)

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
    label?: string
    error?: string
    containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, variant, label, error, id, containerClassName, ...props }, ref) => {
        const inputElement = (
            <div className="flex flex-col gap-1 w-full">
                <input
                    id={id}
                    type={type}
                    className={cn(inputVariants({ variant, className }), error && "border-destructive focus-visible:ring-destructive")}
                    ref={ref}
                    {...props}
                />
                {error && <span className="text-xs text-destructive font-medium">{error}</span>}
            </div>
        )

        if (!label) {
            return inputElement
        }

        return (
            <div className={cn("ui-input-wrapper", containerClassName)}>
                <label className="ui-input-label" htmlFor={id}>
                    {label}
                </label>
                {inputElement}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input, inputVariants }
