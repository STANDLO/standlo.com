"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Environment } from "@react-three/drei";
import { Cuboid } from "lucide-react";

export default function CanvasManagerPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 flex flex-col h-[calc(100vh-4rem)]">
            <header className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Cuboid className="w-8 h-8 text-primary" />
                        Canvas 3D Manager (Viewer)
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Simple WebGL Viewer for previewing 3D renders of Stands and Assemblies.
                    </p>
                </div>
            </header>

            <div className="border rounded-xl bg-card shadow-sm flex-1 overflow-hidden relative">
                <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                    <color attach="background" args={["#f0f0f0"]} />
                    <OrbitControls makeDefault />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                    <Environment preset="city" />
                    <Box args={[2, 2, 2]}>
                        <meshStandardMaterial color="hsl(var(--primary))" />
                    </Box>
                    <gridHelper args={[20, 20]} />
                </Canvas>
            </div>
        </div>
    );
}
