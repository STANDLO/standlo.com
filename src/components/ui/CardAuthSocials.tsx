"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"

import { CardDivider } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface CardAuthSocialsProps {
    onGoogleLogin: () => void;
    onGithubLogin: () => void;
    isLoading?: boolean;
}

export function CardAuthSocials({ onGoogleLogin, onGithubLogin, isLoading }: CardAuthSocialsProps) {
    const tAuth = useTranslations("Auth");
    const { resolvedTheme } = useTheme();
    const btnVariant = resolvedTheme === "dark" ? "dark" : "light";

    return (
        <div className="ui-card-auth-socials">
            <CardDivider>
                {tAuth("socialDivider")}
            </CardDivider>

            <div className="ui-card-auth-socials-group">
                <Button
                    type="button"
                    variant={btnVariant}
                    className="ui-card-auth-social-btn"
                    onClick={onGoogleLogin}
                    disabled={isLoading}
                >
                    {tAuth("continueGoogle")}
                </Button>

                <Button
                    type="button"
                    variant={btnVariant}
                    className="ui-card-auth-social-btn"
                    onClick={onGithubLogin}
                    disabled={isLoading}
                >
                    {tAuth("continueGithub")}
                </Button>
            </div>

            <CardDivider>
                {tAuth("orDivider")}
            </CardDivider>
        </div>
    );
}
