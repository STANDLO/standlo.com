import React from "react";

export const metadata = {
    title: "Privacy Policy | Standlo",
    description: "Informativa sulla privacy dei servizi Standlo.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full">
                <h1 className="text-3xl font-bold text-foreground mb-8">Informativa sulla Privacy</h1>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-4">
                    <p>
                        Questa informativa spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo le tue informazioni quando utilizzi i servizi di interazione e progettazione di <strong>Standlo</strong>.
                    </p>

                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Titolare del Trattamento</h2>
                    <p>
                        Il titolare del trattamento dei tuoi dati personali è:<br />
                        <strong>Kalex AI Inc.</strong><br />
                        Email di contatto: <a href="mailto:privacy@standlo.com" className="text-primary hover:underline">privacy@standlo.com</a>
                    </p>

                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Tecnologie Utilizzate</h2>
                    <p>
                        Al fine di offrire la migliore esperienza di navigazione, tracciamento delle performance e funzionalità avanzate, il nostro sistema fa uso delle seguenti tecnologie:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Cookie e Tracciamento:</strong> Utilizziamo cookie tecnici e di profilazione per gestire l&apos;acceso, salvare le preferenze, analizzare il traffico sul sito e garantire la sicurezza delle sessioni in piattaforma.
                        </li>
                        <li>
                            <strong>Analytics e Misurazioni:</strong> Integriamo servizi di statistica e analisi lato client e server per misurare le interazioni con i nostri servizi, individuare eventuali criticità e ottimizzare l&apos;interfaccia utente.
                        </li>
                        <li>
                            <strong>Intelligenza Artificiale (Google Gemini):</strong> La nostra piattaforma integra i modelli di Intelligenza Artificiale <strong>Gemini</strong> forniti da <strong>Google</strong>. I prompt di interazione testuale o multimodale inviati tramite i nostri strumenti assistivi possono essere elaborati da Google Cloud per fornire risposte, calcoli e completamenti automatici. Ti consigliamo di fare riferimento anche all&apos;informativa sulla privacy di Google per maggiori dettagli sul trattamento dei dati elaborati dai modelli cloud.
                        </li>
                    </ul>

                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Finalità del Trattamento</h2>
                    <p>
                        Le tue informazioni personali sono necessarie per creare e gestire il tuo account, facilitare la firma elettronica tramite Firebase Authentication, processare le tue configurazioni di allestimento ed erogare tutti i servizi richiesti.
                    </p>

                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Condivisione e Sicurezza</h2>
                    <p>
                        Proteggiamo i tuoi dati utilizzando standard di sicurezza avanzati e crittografia in transito e a riposo. Condividiamo i tuoi dati solo con i partner tecnici operativi strettamente necessari per l&apos;esecuzione del servizio (come hosting cloud e provider AI), nel rispetto del GDPR e di tutte le direttive applicabili.
                    </p>

                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. I tuoi Diritti</h2>
                    <p>
                        In ogni momento puoi esercitare i tuoi diritti di accesso, rettifica, cancellazione (diritto all&apos;oblio) e limitazione del trattamento inviandoci esplicita richiesta all&apos;indirizzo: <a href="mailto:privacy@standlo.com" className="text-primary hover:underline">privacy@standlo.com</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
