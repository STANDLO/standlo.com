"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const buttonVariants = cva(
    "ui-btn",
    {
        variants: {
            variant: {
                default: "ui-btn-default",
                defaultMuted: "ui-btn-default-muted",
                defaultReadonly: "ui-btn-default-readonly",
                defaultOutline: "ui-btn-default-outline",

                light: "ui-btn-light",
                lightMuted: "ui-btn-light-muted",
                lightReadonly: "ui-btn-light-readonly",
                lightOutline: "ui-btn-light-outline",

                dark: "ui-btn-dark",
                darkMuted: "ui-btn-dark-muted",
                darkReadonly: "ui-btn-dark-readonly",
                darkOutline: "ui-btn-dark-outline",

                green: "ui-btn-green",
                greenMuted: "ui-btn-green-muted",
                greenReadonly: "ui-btn-green-readonly",
                greenOutline: "ui-btn-green-outline",

                blue: "ui-btn-blue",
                blueMuted: "ui-btn-blue-muted",
                blueReadonly: "ui-btn-blue-readonly",
                blueOutline: "ui-btn-blue-outline",

                yellow: "ui-btn-yellow",
                yellowMuted: "ui-btn-yellow-muted",
                yellowReadonly: "ui-btn-yellow-readonly",
                yellowOutline: "ui-btn-yellow-outline",

                fuchsia: "ui-btn-fuchsia",
                fuchsiaMuted: "ui-btn-fuchsia-muted",
                fuchsiaReadonly: "ui-btn-fuchsia-readonly",
                fuchsiaOutline: "ui-btn-fuchsia-outline",

                violet: "ui-btn-violet",
                violetMuted: "ui-btn-violet-muted",
                violetReadonly: "ui-btn-violet-readonly",
                violetOutline: "ui-btn-violet-outline",

                red: "ui-btn-red",
                redMuted: "ui-btn-red-muted",
                redReadonly: "ui-btn-red-readonly",
                redOutline: "ui-btn-red-outline",

                orange: "ui-btn-orange",
                orangeMuted: "ui-btn-orange-muted",
                orangeReadonly: "ui-btn-orange-readonly",
                orangeOutline: "ui-btn-orange-outline",

                outline: "ui-btn-outline",
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
        const { resolvedTheme } = useTheme()

        let activeVariant = variant
        if (!activeVariant) {
            activeVariant = resolvedTheme === "dark" ? "dark" : "light"
        }

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
