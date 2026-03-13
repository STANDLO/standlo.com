import React, { useState } from "react";
import { DesignCard } from "@/components/ui/DesignCard";
import { AlignLeft, ChevronRight, ChevronDown, Box, Layers, Cuboid } from "lucide-react";

import { useDesignStore } from "@/lib/zustand";

export interface TreeNodeType {
    id: string;
    name: string;
    type: string;
    expanded?: boolean;
    children?: TreeNodeType[];
}

// Recursive TreeNode Component
const TreeNode = ({ node, level = 0 }: { node: TreeNodeType, level?: number }) => {
    const [expanded, setExpanded] = useState(node.expanded || false);
    const hasChildren = node.children && node.children.length > 0;

    const getIcon = (type: string) => {
        switch (type) {
            case "design": return <Box className="w-4 h-4 text-teal-500 shrink-0" />;
            case "assembly": return <Layers className="w-4 h-4 text-purple-500 shrink-0" />;
            case "part": return <Cuboid className="w-4 h-4 text-blue-500 shrink-0" />;
            default: return <Cuboid className="w-3 h-3 text-muted-foreground shrink-0" />;
        }
    };

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-1 hover:bg-muted/30 cursor-pointer rounded-md ${level === 0 ? "font-semibold" : "text-sm"}`}
                style={{ paddingLeft: `${level * 12}px` }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="w-4 flex items-center justify-center mr-1">
                    {hasChildren && (
                        expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    )}
                </div>
                {getIcon(node.type)}
                <span className="ml-2 truncate flex-1">{node.name}</span>
            </div>

            {hasChildren && expanded && (
                <div className="ml-2 border-l border-border/40 pl-1 mt-1">
                    {(node.children || []).map((child: TreeNodeType) => (
                        <TreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export function DesignHierarchyTree({ entityId }: { entityId: string }) {
    const entities = useDesignStore((state) => state.entities);

    // Map existing entities to the tree - this will be recursive later if parent-child relationships are added
    const treeNodes: TreeNodeType[] = Object.values(entities).map(entity => ({
        id: entity.id,
        name: `${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} ${entity.id.slice(0, 4)}`,
        type: entity.type,
    }));

    return (
        <DesignCard
            transparent
            title={
                <React.Fragment>
                    <AlignLeft className="w-4 h-4 text-muted-foreground mr-1" />
                    <span className="truncate">Canvas: {entityId.slice(0, 8)}...</span>
                </React.Fragment>
            }
            position="top-left"
            width="w-64"
        >
            <div className="space-y-1">
                {treeNodes.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2 italic bg-muted/20 rounded-md">
                        Drag parts or assemblies from the palette to start building.
                    </div>
                ) : (
                    treeNodes.map(node => (
                        <TreeNode key={node.id} node={node} />
                    ))
                )}
            </div>
        </DesignCard>
    );
}
