"use client";

import { useCanvasStore } from "./store";
import { Button } from "@/components/ui/Button";
import { X, ChevronRight, Check } from "lucide-react";

export function CanvasTour() {
    const tutorialStep = useCanvasStore((state) => state.tutorialStep);
    const setTutorialStep = useCanvasStore((state) => state.setTutorialStep);

    if (tutorialStep === null) return null;

    const handleNext = () => {
        setTutorialStep(tutorialStep + 1);
    };

    const handleClose = () => {
        setTutorialStep(null);
    };

    let positionClass = "";
    let title = "";
    let text = "";
    let showNext = true;

    switch (tutorialStep) {
        case 1:
            positionClass = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
            title = "Benvenuto in Standlo 3D!";
            text = "Trascina un elemento dal catalogo a sinistra per iniziare a progettare il tuo stand.";
            break;
        case 2:
            positionClass = "top-20 right-20";
            title = "Strumenti di Lavoro";
            text = "Usa gli strumenti in alto per spostare o ruotare gli oggetti e per cambiare il tipo di visuale (Es. Ortogonale).";
            break;
        case 3:
            positionClass = "top-20 right-64";
            title = "Gestione Livelli (Layers)";
            text = "Prova a cambiare il Livello Attivo dal menu in alto a destra. Noterai che i livelli inattivi diventano trasparenti per facilitare il lavoro!";
            break;
        case 4:
            positionClass = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
            title = "Sei Pronto!";
            text = "Fantastico, hai esplorato le funzionalità base! Ricorda che puoi salvare il link pubblico per non perdere il tuo lavoro.";
            showNext = false;
            break;
        default:
            return null;
    }

    return (
        <div className={`absolute z-[100] ${positionClass} animate-in fade-in zoom-in duration-300`}>
            {/* Spotlight/Pulse ring around the popover could go here, but a clean card is enough */}
            <div className="bg-background/95 backdrop-blur-md p-5 rounded-xl border shadow-2xl flex flex-col gap-3 w-[300px] relative pointer-events-auto">
                <button 
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                
                <h3 className="font-bold text-lg pr-6 text-primary">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                
                <div className="flex justify-between items-center mt-2 pt-3 border-t">
                    <span className="text-xs font-medium text-muted-foreground">
                        {tutorialStep} / 4
                    </span>
                    {showNext ? (
                        <Button size="sm" onClick={handleNext} className="h-8 gap-1">
                            Avanti <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button size="sm" onClick={handleClose} className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white">
                            <Check className="w-4 h-4" /> Ho Capito
                        </Button>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
            `}} />
        </div>
    );
}
