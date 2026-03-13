import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/Icon"

export type CardColor = "default" | "green" | "blue" | "yellow" | "fucsia" | "violet" | "red" | "orange" | "dark" | "light";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    color?: CardColor;
    layout?: 'full' | 'auto';
    variant?: 'post-it' | 'standard';
    title?: React.ReactNode;
    icon?: React.ReactNode | boolean;
    action?: React.ReactNode;
    footer?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, color = "default", layout = "auto", variant, title, icon, action, footer, children, ...props }, ref) => {
        // If variant is explicitly post-it, or if color is provided and not default (legacy support)
        const isPostIt = variant === 'post-it' || (!variant && color !== "default");
        const effectiveColor = color;
        const hasStructuredProps = title || footer || action || icon !== undefined;

        const content = hasStructuredProps ? (
            <>
                <CardHeader className={cn(isPostIt && "ui-card-header-post-it")}>
                    <div className="ui-card-header-content">
                        {icon !== false && (
                            (typeof icon === 'boolean' && icon === true) || (icon === undefined) ? (
                                <CardIcon color={effectiveColor} className={cn(isPostIt && "ui-card-icon-post-it")} />
                            ) : icon ? (
                                <div className={cn("ui-card-icon", isPostIt && "ui-card-icon-post-it")}>{icon}</div>
                            ) : null
                        )}
                        {title && <CardTitle>{title}</CardTitle>}
                    </div>
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
                    isPostIt ? `ui-card-post-it card-post-it ${effectiveColor} theme-${effectiveColor}` : "",
                    layout === "full" ? "ui-card-layout-full" : "ui-card-layout-auto",
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
        if (color === "default") {
            return (
                <div ref={ref} className={cn("ui-card-icon", className)} {...props}>
                    <Icon size="m" icon="black" className="!flex dark:!hidden" />
                    <Icon size="m" icon="white" className="!hidden dark:!flex" />
                </div>
            );
        }

        const iconColor = (color === "green" || color === "yellow" || color === "light") ? "black" : "white";

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
