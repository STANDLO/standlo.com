import Image from "next/image";
import Link from "next/link";

type LogoSize = "s" | "m" | "l" | "xl" | "xxl";
export type LogoColor = "default" | "green" | "blue" | "yellow" | "fucsia" | "violet" | "red" | "orange" | "white" | "black";
export type LogoBackground = "transparent" | "white" | "black" | "colored";
export type LogoVariant = "standard" | "post-it";

interface LogoProps {
    className?: string;
    size?: LogoSize;
    color?: LogoColor;
    bg?: LogoBackground;
    variant?: LogoVariant;
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
    s: { width: 135, height: 24 },
    m: { width: 180, height: 32 },
    l: { width: 270, height: 48 },
    xl: { width: 360, height: 64 },
    xxl: { width: 540, height: 96 },
};

const COLOR_MAP: Record<string, string> = {
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

export function Logo({ className = "", size = "l", color = "default", bg = "transparent", variant = "post-it" }: LogoProps) {
    const dim = SIZE_MAP[size];
    const iconDimension = dim.height;

    if (variant === "standard" && color === "default") {
        return (
            <Link href="/" className={`layout-logo-wrapper ${className}`.trim()}>
                {/* Logo in Light Mode (hidden in dark mode) */}
                <Image
                    src="/logo_light.webp"
                    alt="STANDLO Logo"
                    width={dim.width}
                    height={dim.height}
                    className="layout-logo-light"
                    priority
                />
                {/* Logo in Dark Mode (hidden in light mode) */}
                <Image
                    src="/logo_dark.webp"
                    alt="STANDLO Logo"
                    width={dim.width}
                    height={dim.height}
                    className="layout-logo-dark"
                    priority
                />
            </Link>
        );
    }

    if (variant === "post-it") {
        const postItColor = color === "default" ? "green" : color;
        const bgColor = COLOR_MAP[postItColor];
        // Ensure icon is visible against post-it color
        const iconSrc = (postItColor === "yellow" || postItColor === "white" || postItColor === "green") ? "/icon_black.png" : "/icon_white.png";

        return (
            <Link
                href="/"
                className={`layout-logo-wrapper flex flex-col relative overflow-hidden shadow-md transition-transform hover:-translate-y-0.5 shrink-0 ${className}`.trim()}
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
                <div className="absolute top-0 inset-x-0 h-1/5 bg-black/10 z-10" />

                {/* Centered Icon */}
                <div className="flex-1 flex items-center justify-center relative z-20 pt-[5%]">
                    <Image
                        src={iconSrc}
                        alt={`STANDLO Icon ${postItColor}`}
                        width={iconDimension * 0.55}
                        height={iconDimension * 0.55}
                        className="object-contain drop-shadow-sm"
                        priority
                    />
                </div>
            </Link>
        );
    }

    // Icon rendering logic for non-post-it standard variant
    let iconSrc = `/icon_${color}.png`;

    // If background is colored, forcing the icon to be white (or black if color is white/yellow for contrast if needed, but per request white icon on colored bg)
    if (bg === "colored") {
        iconSrc = (color === "yellow" || color === "white") ? "/icon_black.png" : "/icon_white.png";
    }

    let bgStyle: React.CSSProperties = {};
    if (bg === "colored") {
        bgStyle = { backgroundColor: COLOR_MAP[color] };
    } else if (bg === "white") {
        bgStyle = { backgroundColor: "#FFFFFF" };
    } else if (bg === "black") {
        bgStyle = { backgroundColor: "#000000" };
    }

    return (
        <Link
            href="/"
            className={`layout-logo-wrapper flex items-center justify-center ${className}`.trim()}
            style={{
                width: iconDimension,
                height: iconDimension,
                ...bgStyle
            }}
        >
            <Image
                src={iconSrc}
                alt={`STANDLO Icon ${color}`}
                width={iconDimension}
                height={iconDimension}
                className="object-contain"
                priority
            />
        </Link>
    );
}
