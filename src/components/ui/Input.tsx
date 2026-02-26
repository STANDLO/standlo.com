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
                success: "ui-input-success",
                warning: "ui-input-warning",
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

import { Eye, EyeOff } from "lucide-react"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, variant, label, error, id, containerClassName, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const isPasswordType = type === "password";
        const currentType = isPasswordType ? (showPassword ? "text" : "password") : type;

        const inputElement = (
            <div className="flex flex-col gap-1 w-full">
                <div className="relative w-full">
                    <input
                        id={id}
                        type={currentType}
                        autoComplete={props.autoComplete || "off"}
                        className={cn(
                            inputVariants({ variant, className }),
                            error && "border-destructive focus-visible:ring-destructive",
                            isPasswordType && "pr-10"
                        )}
                        ref={ref}
                        {...props}
                    />
                    {isPasswordType && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                </div>
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
