import { getTranslations } from "next-intl/server";
import { Wrench } from "lucide-react";

export async function DevMode({ role }: { role: string }) {
    const t = await getTranslations("components");

    return (
        <div className="ui-dashboard-wrapper flex items-center justify-center min-h-[50vh]">
            <div className="ui-dashboard-card text-center max-w-lg w-full flex flex-col items-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Wrench className="w-8 h-8 text-primary" />
                </div>
                <h2 className="ui-dashboard-card-title text-2xl mb-4">
                    {t("devMode.title", { fallback: "Work in Progress" })}
                </h2>
                <div className="ui-dashboard-card-value text-base text-muted-foreground font-normal mb-8 leading-relaxed">
                    {t("devMode.description", {
                        fallback: "L'ambiente dedicato a questo ruolo è attualmente in fase di sviluppo. Stiamo creando strumenti su misura per ottimizzare il tuo flusso di lavoro. Torna a trovarci presto!"
                    })}
                </div>
                <div className="inline-flex items-center justify-center px-4 py-2 bg-muted rounded-md text-sm font-medium text-muted-foreground">
                    Namespace: <span className="font-bold ml-1 text-foreground">{role}</span>
                </div>
            </div>
        </div>
    );
}
