"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "ui-btn",
    {
        variants: {
            variant: {
                default: "ui-btn-theme",
                defaultMuted: "ui-btn-theme-muted",
                defaultReadonly: "ui-btn-theme-readonly",
                defaultOutline: "ui-btn-theme-outline",

                light: "ui-btn-theme theme-light",
                lightMuted: "ui-btn-theme-muted theme-light",
                lightReadonly: "ui-btn-theme-readonly theme-light",
                lightOutline: "ui-btn-theme-outline theme-light",

                dark: "ui-btn-theme theme-dark",
                darkMuted: "ui-btn-theme-muted theme-dark",
                darkReadonly: "ui-btn-theme-readonly theme-dark",
                darkOutline: "ui-btn-theme-outline theme-dark",

                green: "ui-btn-theme theme-green",
                greenMuted: "ui-btn-theme-muted theme-green",
                greenReadonly: "ui-btn-theme-readonly theme-green",
                greenOutline: "ui-btn-theme-outline theme-green",

                blue: "ui-btn-theme theme-blue",
                blueMuted: "ui-btn-theme-muted theme-blue",
                blueReadonly: "ui-btn-theme-readonly theme-blue",
                blueOutline: "ui-btn-theme-outline theme-blue",

                yellow: "ui-btn-theme theme-yellow",
                yellowMuted: "ui-btn-theme-muted theme-yellow",
                yellowReadonly: "ui-btn-theme-readonly theme-yellow",
                yellowOutline: "ui-btn-theme-outline theme-yellow",

                fuchsia: "ui-btn-theme theme-fucsia",
                fuchsiaMuted: "ui-btn-theme-muted theme-fucsia",
                fuchsiaReadonly: "ui-btn-theme-readonly theme-fucsia",
                fuchsiaOutline: "ui-btn-theme-outline theme-fucsia",

                violet: "ui-btn-theme theme-violet",
                violetMuted: "ui-btn-theme-muted theme-violet",
                violetReadonly: "ui-btn-theme-readonly theme-violet",
                violetOutline: "ui-btn-theme-outline theme-violet",

                red: "ui-btn-theme theme-red",
                redMuted: "ui-btn-theme-muted theme-red",
                redReadonly: "ui-btn-theme-readonly theme-red",
                redOutline: "ui-btn-theme-outline theme-red",

                orange: "ui-btn-theme theme-orange",
                orangeMuted: "ui-btn-theme-muted theme-orange",
                orangeReadonly: "ui-btn-theme-readonly theme-orange",
                orangeOutline: "ui-btn-theme-outline theme-orange",

                outline: "ui-btn-theme-outline",
            },
            size: {
                default: "ui-btn-size-default",
                sm: "ui-btn-size-sm",
                lg: "ui-btn-size-lg",
                icon: "ui-btn-size-icon",
            },
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
        const activeVariant = variant || "default"

        return (
            <button
                className={cn(buttonVariants({ variant: activeVariant, size: size || "default", className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
