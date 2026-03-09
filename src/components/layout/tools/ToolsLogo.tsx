import * as React from "react";
import { Logo } from "@/components/ui/Logo";

export function ToolsLogo() {
    return (
        <div className="fixed top-8 left-8 pointer-events-auto">
            {/* Setting fixed size for the Logo container to ensure it renders at 48x48 */}
            <div style={{ width: 48, height: 48 }}>
                {/* The Logo itself defaults to post-it variant. Overriding the size prop to force layout if needed, though Logo internally maps to predetermined sizes. We'll rely on the minWidth/minHeight from our previous refactor, but we can pass 'color="green"' to be explicit. The `style` in Logo will enforce dimensions based on the `size` prop's mapped height. `size="l"` maps to 48px height. */}
                <Logo size="l" color="green" />
            </div>
        </div>
    );
}
