import Image from "next/image";

type LogoSize = "s" | "m" | "l" | "xl" | "xxl";

interface LogoProps {
    className?: string;
    size?: LogoSize;
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
    s: { width: 135, height: 24 },
    m: { width: 180, height: 32 },
    l: { width: 270, height: 48 },
    xl: { width: 360, height: 64 },
    xxl: { width: 540, height: 96 },
};

export function Logo({ className = "", size = "l" }: LogoProps) {
    const { width, height } = SIZE_MAP[size];

    return (
        <div className={`layout-logo-wrapper ${className}`.trim()}>
            {/* Logo in Light Mode (hidden in dark mode) */}
            <Image
                src="/logo_light.webp"
                alt="STANDLO Logo"
                width={width}
                height={height}
                className="layout-logo-light"
                priority
            />
            {/* Logo in Dark Mode (hidden in light mode) */}
            <Image
                src="/logo_dark.webp"
                alt="STANDLO Logo"
                width={width}
                height={height}
                className="layout-logo-dark"
                priority
            />
        </div>
    );
}
