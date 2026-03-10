"use client";

import * as React from "react";
import { ImagePlus, Trash2, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage } from "@/core/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/Button";

export interface GalleryProps {
    path: string;            // Firebase Storage upload path (e.g. 'public/onboarding/{uid}')
    value?: string[];        // Array of image download URLs
    onChange?: (urls: string[]) => void;
    label?: string;
    error?: string;
    containerClassName?: string;
    maxFiles?: number;       // Maximum number of images allowed
    accept?: string;         // e.g. "image/png, image/jpeg"
    id?: string;             // explicit html element id
}

export function Gallery({
    path,
    value = [],
    onChange,
    label,
    error,
    containerClassName,
    maxFiles = 10,
    accept = "image/png",
    id
}: GalleryProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [uploadingFiles, setUploadingFiles] = React.useState<Record<string, number>>({});
    const inputRef = React.useRef<HTMLInputElement>(null);

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        await handleFiles(Array.from(e.target.files));
        if (inputRef.current) {
            inputRef.current.value = ""; // reset input
        }
    };

    const handleFiles = async (files: File[]) => {
        const currentCount = value.length;
        const availableSlots = maxFiles - currentCount;
        if (availableSlots <= 0) return;

        // Take only up to availableSlots
        const filesToProcess = files.slice(0, availableSlots);

        // Upload each file
        const uploadPromises = filesToProcess.map(async (file) => {
            const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const fileExt = file.name.split('.').pop() || "png";
            const storagePath = `${path}/${fileId}.${fileExt}`;
            const storageRef = ref(storage, storagePath);

            // Set initial progress
            setUploadingFiles(prev => ({ ...prev, [fileId]: 0 }));

            return new Promise<string | null>((resolve) => {
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadingFiles(prev => ({ ...prev, [fileId]: progress }));
                    },
                    (error) => {
                        console.error("Gallery file upload failed:", error);
                        setUploadingFiles(prev => {
                            const newState = { ...prev };
                            delete newState[fileId];
                            return newState;
                        });
                        resolve(null);
                    },
                    async () => {
                        try {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            setUploadingFiles(prev => {
                                const newState = { ...prev };
                                delete newState[fileId];
                                return newState;
                            });
                            resolve(url);
                        } catch (e) {
                            console.error("Failed to get download URL", e);
                            resolve(null);
                        }
                    }
                );
            });
        });

        const urls = await Promise.all(uploadPromises);
        const successfulUrls = urls.filter((url): url is string => url !== null);

        if (successfulUrls.length > 0 && onChange) {
            onChange([...value, ...successfulUrls]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const makeDefault = (index: number) => {
        if (index === 0 || !onChange) return;
        const newValue = [...value];
        const [item] = newValue.splice(index, 1);
        newValue.unshift(item); // Move to the front (index 0)
        onChange(newValue);
    };

    const removeImage = async (index: number, urlToDelete: string) => {
        if (!onChange) return;

        // Optimistic UI update
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);

        // Optionally attempt to delete from storage if it belongs to our path
        try {
            // Very naive check to prevent deleting external URLs accidentally
            if (urlToDelete.includes("firebasestorage.googleapis.com") && urlToDelete.includes(encodeURIComponent(path))) {
                const fileRef = ref(storage, urlToDelete);
                await deleteObject(fileRef);
            }
        } catch (e) {
            console.error("Failed to delete object from storage (it may already be gone or permissions are missing):", e);
        }
    };

    const reactId = React.useId();
    const fileInputId = id || `gallery-input-${reactId}`;

    const galleryElement = (
        <div className="flex flex-col gap-4 w-full">
            {/* Upload Zone */}
            {value.length < maxFiles && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                        isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                        error && "border-destructive/50"
                    )}
                >
                    <input
                        id={fileInputId}
                        type="file"
                        className="hidden"
                        accept={accept}
                        multiple={maxFiles > 1}
                        ref={inputRef}
                        onChange={onFileSelect}
                    />
                    <ImagePlus className={cn("w-8 h-8 mb-2", isDragging ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-sm font-medium text-center">
                        Clicca o trascina qui per caricare
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                        {accept.includes("png") ? "File PNG supportati" : "File supportati"} (Max {maxFiles})
                    </p>
                </div>
            )}

            {/* Grid display of uploaded images & loaders */}
            {(value.length > 0 || Object.keys(uploadingFiles).length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

                    {/* Uploading placeholders */}
                    {Object.entries(uploadingFiles).map(([uploadId, progress]) => (
                        <div key={uploadId} className="relative aspect-square rounded-lg border flex flex-col items-center justify-center bg-muted/30 overflow-hidden">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                            <div className="w-3/4 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.max(progress, 5)}%` }} />
                            </div>
                        </div>
                    ))}

                    {/* Uploaded Images */}
                    {value.map((url, i) => (
                        <div key={url} className={cn("relative aspect-square rounded-lg border group overflow-hidden bg-background", i === 0 ? "ring-2 ring-primary" : "")}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Gallery item ${i}`} className="object-cover w-full h-full" />

                            {/* Actions Overlay */}
                            <div className="absolute inset-x-0 bottom-0 flex justify-between items-center p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    variant="default"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); makeDefault(i); }}
                                    className={cn("h-7 w-7 rounded-sm", i === 0 ? "text-yellow-400 opacity-100" : "text-white hover:text-yellow-400")}
                                    title="Imposta come Default (Copertina)"
                                >
                                    <Star className="w-4 h-4" fill={i === 0 ? "currentColor" : "none"} />
                                </Button>

                                <Button
                                    type="button"
                                    variant="default"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); removeImage(i, url); }}
                                    className="h-7 w-7 rounded-sm"
                                    title="Rimuovi"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Default Badge */}
                            {i === 0 && (
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    DEFAULT
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {error && <span className="text-xs text-destructive font-medium">{error}</span>}
        </div>
    );

    if (!label) {
        return galleryElement;
    }

    return (
        <div className={cn("ui-input-wrapper", containerClassName)}>
            <label className="ui-input-label" htmlFor={fileInputId}>
                {label}
            </label>
            {galleryElement}
        </div>
    );
}
