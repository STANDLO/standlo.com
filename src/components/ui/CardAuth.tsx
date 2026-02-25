import * as React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Logo } from "@/components/ui/Logo"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface CardAuthProps {
    title: string
    description?: string
    children: React.ReactNode
    footerHref?: string
    footerText?: string
    footerActionText?: string
    onGoogleLogin?: () => void
    onGithubLogin?: () => void
    isLoading?: boolean
}

export function CardAuth({
    title,
    description,
    children,
    footerHref,
    footerText,
    footerActionText,
    onGoogleLogin,
    onGithubLogin,
    isLoading
}: CardAuthProps) {
    const tAuth = useTranslations("Auth")
    const tBrand = useTranslations("Brand")

    return (
        <Card className="layout-auth-card">
            <CardHeader className="layout-auth-card-header">
                <Logo size="m" className="layout-auth-logo" />
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {children}

                {onGoogleLogin && onGithubLogin && (
                    <div className="mt-6 w-full">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    {tAuth("dividerText")}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={onGoogleLogin}
                                disabled={isLoading}
                            >
                                {tAuth("continueGoogle")}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={onGithubLogin}
                                disabled={isLoading}
                            >
                                {tAuth("continueGithub")}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="layout-auth-card-footer">
                {footerText && footerHref && footerActionText && (
                    <div className="layout-auth-card-note">
                        {footerText}{" "}
                        <Link href={footerHref as string} className="layout-auth-card-link">
                            {footerActionText}
                        </Link>
                    </div>
                )}
                <div className="layout-auth-card-copyright">
                    {tBrand("copyright", { year: new Date().getFullYear() })}
                </div>
            </CardFooter>
        </Card>
    )
}
