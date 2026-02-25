import * as React from "react"
import { Logo } from "@/components/ui/Logo"

interface CardOnboardingProps {
    title: string
    subtitle: string
    children: React.ReactNode
}

export function CardOnboarding({
    title,
    subtitle,
    children,
}: CardOnboardingProps) {
    return (
        <div className="layout-onboarding-card">
            <div className="layout-onboarding-header-wrapper">
                <Logo size="m" className="layout-onboarding-logo" />
                <h2 className="layout-onboarding-title">{title}</h2>
                <p className="layout-onboarding-subtitle">{subtitle}</p>
            </div>

            <div className="layout-onboarding-content">
                {children}
            </div>

            <div className="layout-onboarding-footer">
                <p>&copy; {new Date().getFullYear()} Standlo. Tutti i diritti riservati.</p>
            </div>
        </div>
    )
}
