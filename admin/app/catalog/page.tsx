"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Hammer } from "lucide-react";

export default function MasterCatalogPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Libreria CAD (In costruzione)</h1>
                <p className="text-muted-foreground mt-2">
                    L&apos;integrazione diretta con Fusion 360 è attualmente in fase di sviluppo.
                    Questa sezione permetterà di ispezionare i modelli 3D e i metadati inviati dal
                    nuovo Plugin Standlo.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hammer className="h-5 w-5 text-muted-foreground" />
                        Next-Gen 3D Sync
                    </CardTitle>
                    <CardDescription>
                        Stiamo eliminando la latenza dei Webhook passando a un sync diretto tramite API.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    I tuoi progettisti spingeranno i modelli (Parts, Assemblies, Stands)
                    direttamente da Fusion 360 a Firebase.
                </CardContent>
            </Card>
        </div>
    );
}
