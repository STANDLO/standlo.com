import React, { useState } from "react";
import { DesignCard } from "@/components/ui/DesignCard";
import { Button } from "@/components/ui/Button";
import { Box, Layers, Building2, Plus, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
// Request user token handled elsewhere
import { FormCreate } from "@/components/ui/FormCreate";
import { UIFieldMeta } from "@/core/meta";
import { CanvasCreateSchema } from "../../../../functions/src/schemas/canvas";

interface WizardProps {
    roleId: string;
    locale: string;
}

export function DesignCreationWizard({ roleId, locale }: WizardProps) {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<"part" | "assembly" | "design" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateSubmit = async (data: Record<string, unknown>) => {
        setIsSubmitting(true);
        try {
            const { callGateway } = await import("@/lib/api");

            const resultPayload = await callGateway<{ id: string }>("orchestrator", {
                actionId: "create_entity",
                entityId: selectedType || "design", // Acts as context for the orchestrator
                payload: {
                    ...data,
                    type: selectedType,
                    nodes: []
                }
            });

            if (resultPayload?.id) {
                // Navigate to the new entity's canvas or sculptor, providing type to the router
                const newId = resultPayload.id;
                router.push(`/${locale}/partner/${roleId}/canvas?id=${newId}&type=${selectedType}`);
            } else {
                console.error("Backend validation or creation failed:", resultPayload);
                alert("Creation failed on backend. Please check your data.");
            }

        } catch (error) {
            console.error("Failed to create canvas entity:", error);
            alert("Error communicating with Canvas Gateway.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formSchema = CanvasCreateSchema.omit({ type: true });

    const fields: UIFieldMeta[] = [
        {
            key: "name",
            type: "text",
            label: "Entity Name",
            placeholder: `e.g. New ${selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : ''}`,
            gridSpan: "col-span-1 md:col-span-2"
        },
        {
            key: "code",
            type: "text",
            label: "Unique Code",
            placeholder: `${selectedType === 'part' ? 'PAR' : selectedType === 'assembly' ? 'ASS' : 'DES'}-${Date.now()}`,
            gridSpan: "col-span-1 md:col-span-2"
        }
    ];

    return (
        <DesignCard
            title="Create New Canvas Document"
            position="center"
            width="w-full max-w-4xl"
            className="border-primary/20 shadow-primary/10"
        >
            <div className="text-center mb-8 mt-4 relative">
                {selectedType && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedType(null)}
                        className="absolute left-0 top-0 hidden md:flex border-none hover:bg-muted"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Types
                    </Button>
                )}
                <h2 className="text-3xl font-bold tracking-tight mb-3">
                    {selectedType ? `Initialize ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : "Welcome to Standlo Canvas"}
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    {selectedType
                        ? `Please provide the details for your new ${selectedType}.`
                        : "You have opened the editor without supplying an Entity ID. Please select the type of 3D document you wish to create."
                    }
                </p>
                {roleId !== "standlo_design" && !selectedType && (
                    <div className="mt-4 inline-block bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold">
                        Note: Only users with the &apos;standlo_design&apos; role can create master templates.
                    </div>
                )}
            </div>

            {!selectedType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
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
                            disabled={roleId !== "standlo_design"}
                            onClick={() => setSelectedType("part")}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
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
                            disabled={roleId !== "standlo_design"}
                            onClick={() => setSelectedType("assembly")}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Assembly
                        </Button>
                    </div>

                    {/* DESIGN COLUMN */}
                    <div className="bg-card border rounded-xl p-6 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                            <Building2 className="w-8 h-8 text-teal-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Space Design</h3>
                        <p className="text-sm text-muted-foreground flex-1 mb-6">
                            The final layout composed of multiple Assemblies and Parts, forming the complete architectural environment (Stands, Bedrooms, Offices).
                        </p>
                        <Button
                            disabled={roleId !== "standlo_design"}
                            onClick={() => setSelectedType("design")}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Design
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="max-w-xl mx-auto p-4 bg-card border rounded-xl">
                    <FormCreate
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        schema={formSchema as any}
                        fields={fields}
                        defaultValues={{
                            name: "",
                            code: `${selectedType === 'part' ? 'PAR' : selectedType === 'assembly' ? 'ASS' : 'DES'}-${Date.now().toString().slice(-6)}`
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onSubmit={handleCreateSubmit as any}
                        submitLabel="Initialize Canvas"
                        loadingLabel="Creating..."
                    />
                    {isSubmitting && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-10 rounded-xl">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </DesignCard>
    );
}

