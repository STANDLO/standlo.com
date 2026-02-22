import * as React from "react"
import { Link } from "@/i18n/routing"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card"

interface CardAuthProps {
    title: string
    description?: string
    children: React.ReactNode
    footerHref?: string
    footerText?: string
    footerActionText?: string
}

export function CardAuth({
    title,
    description,
    children,
    footerHref,
    footerText,
    footerActionText,
}: CardAuthProps) {
    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
            <CardFooter className="flex-col gap-4">
                {footerText && footerHref && footerActionText && (
                    <div className="text-sm text-center text-muted-foreground">
                        {footerText}{" "}
                        <Link href={footerHref as string} className="underline">
                            {footerActionText}
                        </Link>
                    </div>
                )}
                <div className="text-xs text-center text-muted-foreground/60 w-full pt-4 border-t">
                    &copy; {new Date().getFullYear()} STANDLO. All rights reserved.
                </div>
            </CardFooter>
        </Card>
    )
}
