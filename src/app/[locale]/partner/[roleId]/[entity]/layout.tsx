import * as React from "react";

export default function EntityLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="ui-form p-6">
            {children}
        </div>
    );
}
