import * as React from "react";
import { Logo } from "@/components/ui/Logo";

export function BaseLogo() {
    return (
        <div className="ui-tools-logo">
            <Logo size="l" postit="green" icon="black" />
        </div>
    );
}
