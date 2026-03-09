import * as React from "react"
import { cn } from "@/lib/utils"

export type CardColor = "default" | "green" | "blue" | "yellow" | "fucsia" | "violet" | "red" | "orange";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: CardColor;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, color = "default", ...props }, ref) => {
        const isPostIt = color !== "default";

        return (
            <div
                ref={ref}
                className={cn(
                    "ui-card",
                    isPostIt
                        ? `card-post-it theme-${color} bg-primary text-primary-foreground rounded-br-[10%_30%] rounded-bl-[2px] shadow-md border-none relative overflow-hidden transition-transform hover:-translate-y-0.5`
                        : "",
                    className
                )}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("ui-card-header", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("ui-card-title text-2xl", className)}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("ui-card-description", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("ui-card-content", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("ui-card-footer", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
