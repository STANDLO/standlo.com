import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

type LogoSize = "s" | "m" | "l" | "xl" | "xxl";
export type LogoColor = "green" | "blue" | "yellow" | "fucsia" | "violet" | "red" | "orange" | "white" | "black";

interface LogoProps {
    className?: string;
    size?: LogoSize;
    icon?: LogoColor;
    postit?: LogoColor;
    slogan?: boolean;
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number; iconHeight: number; sloganSize: string }> = {
    s: { width: 32, height: 32, iconHeight: 18, sloganSize: "text-[0.45rem]" },
    m: { width: 48, height: 48, iconHeight: 26, sloganSize: "text-[0.55rem]" },
    l: { width: 64, height: 64, iconHeight: 36, sloganSize: "text-xs" },
    xl: { width: 96, height: 96, iconHeight: 54, sloganSize: "text-sm" },
    xxl: { width: 128, height: 128, iconHeight: 72, sloganSize: "text-base" },
};

export const PUBLIC_ICONS_URLS: Record<string, string> = {
    black: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_black.png?alt=media&token=039b6bc5-734d-43b5-a9e3-ef8f0134be80",
    blue: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_blue.png?alt=media&token=25f4966f-1ff7-4e7f-8b04-9a9f15e01222",
    fucsia: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_fucsia.png?alt=media&token=3033f70f-bc78-4096-994c-9f68fc82e16c",
    green: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_green.png?alt=media&token=8b6f697a-c966-4a7b-a686-356a3881d940",
    orange: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_orange.png?alt=media&token=3025b149-151e-4de1-8710-972069e81baf",
    red: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_red.png?alt=media&token=9dfddc8f-7c79-40f9-98ec-752173664f52",
    violet: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_violet.png?alt=media&token=051013c1-06b6-43c4-8d9c-f86ab0934b32",
    white: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_white.png?alt=media&token=961e9e04-cebd-4288-8e4d-6d81c278cdba",
    yellow: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ficon_yellow.png?alt=media&token=8ff89a19-f173-4cc6-928e-9e2f5045f036"
};

export const POSTIT_COLOR_MAP: Record<string, string> = {
    green: "#2CFF05",
    blue: "#2323FF",
    yellow: "#FDFF04",
    fucsia: "#FF05D1",
    violet: "#B700FF",
    red: "#EE3C30",
    orange: "#FF8005",
    black: "#000000",
    white: "#FFFFFF",
};

export function Logo({ className = "", size = "l", icon = "black", postit = "green", slogan = false }: LogoProps) {
    const dim = SIZE_MAP[size];
    const iconDimension = dim.height;
    const bgColor = POSTIT_COLOR_MAP[postit];
    const iconSrc = PUBLIC_ICONS_URLS[icon] || PUBLIC_ICONS_URLS.black;
    const t = useTranslations("Brand");

    return (
        <Link
            href="/"
            className={`ui-link group ${className}`.trim()}
        >
            <div
                className="ui-logo"
                style={{
                    width: iconDimension,
                    height: iconDimension,
                    minWidth: iconDimension,
                    minHeight: iconDimension,
                    backgroundColor: bgColor,
                    borderBottomRightRadius: '10% 30%',
                    borderBottomLeftRadius: '2px'
                }}
            >
                {/* Darker glue strip at the top */}
                <div className="ui-logo-glue" />

                {/* Centered Icon */}
                <div className="ui-logo-icon-container">
                    <Image
                        src={iconSrc}
                        alt={`STANDLO Icon ${icon}`}
                        width={167}
                        height={137}
                        style={{ width: 'auto', height: `${dim.iconHeight}px` }}
                        className="ui-logo-icon"
                        priority
                    />
                </div>
            </div>
            {slogan && (
                <div className={`ui-logo-slogan ${dim.sloganSize}`}>
                    {t("slogan")}
                </div>
            )}
        </Link>
    );
}
