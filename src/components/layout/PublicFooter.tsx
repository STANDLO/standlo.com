import * as React from "react"

export function PublicFooter() {
    return (
        <footer className="layout-footer-main">
            <div className="layout-footer-container">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    &copy; {new Date().getFullYear()} STANDLO. Platform per l&apos;allestimento fieristico europeo.
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <a href="#" className="underline underline-offset-4 hover:text-primary">Terms</a>
                    <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy</a>
                </div>
            </div>
        </footer>
    )
}

