import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
    "ui-input min-h-[80px]", // Reusing input semantic classes for consistent borders
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

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
    label?: string
    error?: string
    containerClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, variant, label, error, id, containerClassName, ...props }, ref) => {
        const textareaElement = (
            <div className="flex flex-col gap-1 w-full">
                <textarea
                    id={id}
                    className={cn(textareaVariants({ variant, className }), error && "border-destructive focus-visible:ring-destructive")}
                    ref={ref}
                    {...props}
                />
                {error && <span className="text-xs text-destructive font-medium">{error}</span>}
            </div>
        )

        if (!label) {
            return textareaElement
        }

        return (
            <div className={cn("ui-input-wrapper", containerClassName)}>
                <label className="ui-input-label" htmlFor={id}>
                    {label}
                </label>
                {textareaElement}
            </div>
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
