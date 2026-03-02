import React, { useState } from "react";
import { CanvasCard } from "@/components/ui/CanvasCard";
import { Button } from "@/components/ui/Button";
import { Box, Layers, Building2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/core/firebase"; // Guessing standard client import, will update if wrong

interface WizardProps {
    roleId: string;
    locale: string;
}

export function CanvasCreationWizard({ roleId, locale }: WizardProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState<"part" | "assembly" | "stand" | null>(null);

    const handleCreate = async (type: "part" | "assembly" | "stand") => {
        setIsCreating(type);
        try {
            const createCanvas = httpsCallable(functions, "canvas");
            const result = await createCanvas({
                actionId: "createCanvas",
                entityType: type,
                payload: {
                    name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                    description: "Created via Canvas Editor Wizard",
                    nodes: [] // Empty 3D scene root
                }
            });

            // Cast result and route
            const data = result.data as { status: string; id: string };
            if (data?.status === "success" && data?.id) {
                // Navigate to the new entity's canvas
                router.push(`/${locale}/partner/${roleId}/canvas?id=${data.id}`);
            } else {
                alert("Creation failed on backend.");
            }

        } catch (error) {
            console.error("Failed to create canvas entity:", error);
            alert("Error communicating with Canvas Gateway.");
        } finally {
            setIsCreating(null);
        }
    };

    return (
        <CanvasCard
            title="Create New Canvas Document"
            position="center"
            width="w-full max-w-4xl"
            className="border-primary/20 shadow-primary/10"
        >
            <div className="text-center mb-8 mt-4">
                <h2 className="text-3xl font-bold tracking-tight mb-3">Welcome to Standlo Canvas</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    You have opened the editor without supplying an Entity ID.
                    Please select the type of 3D document you wish to create to initialize the scene.
                </p>
                {roleId !== "standlo_design" && (
                    <div className="mt-4 inline-block bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold">
                        Note: Only users with the &apos;standlo_design&apos; role can create master templates.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">

                {/* PART COLUMN */}
                <div className="bg-card border rounded-xl p-6 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <Box className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Part</h3>
                    <p className="text-sm text-muted-foreground flex-1 mb-6">
                        A singular 3D component (e.g., a wooden panel, a screw, a light fixture). The atomic building block of all structures.
                    </p>
                    <Button
                        disabled={roleId !== "standlo_design" || isCreating !== null}
                        onClick={() => handleCreate("part")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isCreating === "part" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Part
                    </Button>
                </div>

                {/* ASSEMBLY COLUMN */}
                <div className="bg-card border rounded-xl p-6 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                        <Layers className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Assembly</h3>
                    <p className="text-sm text-muted-foreground flex-1 mb-6">
                        A pre-grouped collection of Parts logically joined together (e.g., a complete reception desk, a rigged truss pillar).
                    </p>
                    <Button
                        disabled={roleId !== "standlo_design" || isCreating !== null}
                        onClick={() => handleCreate("assembly")}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {isCreating === "assembly" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Assembly
                    </Button>
                </div>

                {/* STAND COLUMN */}
                <div className="bg-card border rounded-xl p-6 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-teal-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Exhibition Stand</h3>
                    <p className="text-sm text-muted-foreground flex-1 mb-6">
                        The final layout composed of multiple Assemblies and Parts, forming the complete architectural environment for a client.
                    </p>
                    <Button
                        disabled={roleId !== "standlo_design" || isCreating !== null}
                        onClick={() => handleCreate("stand")}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                        {isCreating === "stand" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Stand
                    </Button>
                </div>

            </div>
        </CanvasCard>
    );
}
