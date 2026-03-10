import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/Icon"

export type CardColor = "default" | "green" | "blue" | "yellow" | "fucsia" | "violet" | "red" | "orange";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    color?: CardColor;
    layout?: 'full' | 'auto';
    title?: React.ReactNode;
    icon?: React.ReactNode | boolean;
    action?: React.ReactNode;
    footer?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, color = "default", layout = "auto", title, icon, action, footer, children, ...props }, ref) => {
        const isPostIt = color !== "default";
        const hasStructuredProps = title || footer || action || icon !== undefined;

        const content = hasStructuredProps ? (
            <>
                <CardHeader>
                    {icon !== false && (
                        (typeof icon === 'boolean' && icon === true) || (icon === undefined && isPostIt) ? (
                            <CardIcon color={color} />
                        ) : icon ? (
                            <div className="ui-card-icon">{icon}</div>
                        ) : null
                    )}
                    {title && <CardTitle>{title}</CardTitle>}
                    {action && <div className="ui-card-action">{action}</div>}
                </CardHeader>
                <CardContent>
                    {children}
                </CardContent>
                {footer && <CardFooter>{footer}</CardFooter>}
            </>
        ) : children;

        return (
            <div
                ref={ref}
                className={cn(
                    "ui-card",
                    isPostIt
                        ? `card-post-it theme-${color} bg-primary text-primary-foreground rounded-br-[10%_30%] rounded-bl-[2px] shadow-md border-none relative overflow-hidden transition-transform hover:-translate-y-0.5`
                        : "",
                    layout === "full" ? "w-full h-full flex flex-col" : "m-auto",
                    className
                )}
                {...props}
            >
                {content}
            </div>
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
        className={cn("ui-card-title", className)}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

export interface CardIconProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: CardColor;
}

const CardIcon = React.forwardRef<HTMLDivElement, CardIconProps>(
    ({ className, color = "default", ...props }, ref) => {
        const iconColor = (color === "green" || color === "yellow") ? "black" : "white";

        return (
            <div
                ref={ref}
                className={cn("ui-card-icon", className)}
                {...props}
            >
                <Icon size="m" icon={iconColor} />
            </div>
        )
    }
)
CardIcon.displayName = "CardIcon"

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

const CardDivider = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("ui-card-auth-divider", className)} {...props}>
        <div className="ui-card-auth-divider-line-container">
            <div className="ui-card-auth-divider-line"></div>
        </div>
        {children && (
            <div className="ui-card-auth-divider-text-container">
                <span className="ui-card-auth-divider-text">
                    {children}
                </span>
            </div>
        )}
        <div className="ui-card-auth-divider-line-container">
            <div className="ui-card-auth-divider-line"></div>
        </div>
    </div>
))
CardDivider.displayName = "CardDivider"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardIcon, CardDivider }
