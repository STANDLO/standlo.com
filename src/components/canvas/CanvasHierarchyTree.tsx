import React, { useState } from "react";
import { CanvasCard } from "@/components/ui/CanvasCard";
import { AlignLeft, ChevronRight, ChevronDown, Box, Layers, Cuboid } from "lucide-react";

// Mock hierarchy mimicking Fusion 360 Browser
const DUMMY_TREE = [
    {
        id: "root",
        name: "Main Stand Document",
        type: "stand",
        expanded: true,
        children: [
            {
                id: "a1",
                name: "Reception Desk Assembly",
                type: "assembly",
                expanded: true,
                children: [
                    { id: "p1", name: "Front Panel (Wood)", type: "part" },
                    { id: "p2", name: "Top Desk (Glass)", type: "part" }
                ]
            },
            {
                id: "a2",
                name: "Right Wall Truss 3m",
                type: "assembly",
                expanded: false,
                children: [
                    { id: "p3", name: "Aluminium Profile 3m", type: "part" },
                    { id: "p4", name: "Aluminium Profile 3m", type: "part" }
                ]
            },
            { id: "p5", name: "Floor Carpet 5x5", type: "part" }
        ]
    }
];

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
            case "stand": return <Box className="w-4 h-4 text-teal-500 shrink-0" />;
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

export function CanvasHierarchyTree() {
    return (
        <CanvasCard
            title={
                <React.Fragment>
                    <AlignLeft className="w-4 h-4 text-muted-foreground" />
                    Browser
                </React.Fragment>
            }
            position="top-right"
            width="w-64"
        >
            <div className="text-xs text-muted-foreground mb-4 border-b border-border/10 pb-2">
                Fusion 360 style component tree
            </div>
            <div className="space-y-1">
                {DUMMY_TREE.map(node => (
                    <TreeNode key={node.id} node={node} />
                ))}
            </div>
        </CanvasCard>
    );
}
