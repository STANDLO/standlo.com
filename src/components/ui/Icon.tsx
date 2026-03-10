import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PUBLIC_ICONS_URLS, LogoSize, LogoColor, SIZE_MAP } from "@/components/ui/Logo"

export interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: LogoSize;
    icon?: LogoColor;
}

export const Icon = React.forwardRef<HTMLDivElement, IconProps>(
    ({ className, size = "m", icon = "black", ...props }, ref) => {
        const url = PUBLIC_ICONS_URLS[icon] || PUBLIC_ICONS_URLS["black"]
        const { iconHeight } = SIZE_MAP[size] || SIZE_MAP["m"]

        return (
            <div
                ref={ref}
                className={cn("ui-icon", className)}
                {...props}
            >
                <Image
                    key={icon}
                    src={url}
                    alt={`STANDLO Icon ${icon}`}
                    width={iconHeight}
                    height={iconHeight}
                    className="ui-icon-img"
                    priority
                />
            </div>
        )
    }
)
Icon.displayName = "Icon"
