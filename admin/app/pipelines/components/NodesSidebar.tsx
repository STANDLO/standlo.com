import React from 'react';
import { Play, Zap, Cpu, ArrowRightLeft } from 'lucide-react';

export default function NodesSidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-64 border-r border-[#e3e8ee] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shrink-0 overflow-y-auto">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-4">Node Library</h3>

            <div className="flex flex-col gap-3">
                <div
                    className="ui-canvas-list-item cursor-grab hover:border-indigo-500 scale-95"
                    onDragStart={(event) => onDragStart(event, 'trigger')}
                    draggable
                >
                    <div className="ui-canvas-list-item-content">
                        <div className="ui-canvas-list-item-icon ui-canvas-bg-indigo ui-canvas-text-indigo"><Play className="w-4 h-4" /></div>
                        <div><div className="ui-canvas-list-item-title truncate">Trigger</div><div className="text-xs text-zinc-500">Event starter</div></div>
                    </div>
                </div>

                <div
                    className="ui-canvas-list-item cursor-grab hover:border-blue-500 scale-95"
                    onDragStart={(event) => onDragStart(event, 'action')}
                    draggable
                >
                    <div className="ui-canvas-list-item-content">
                        <div className="ui-canvas-list-item-icon ui-canvas-bg-blue ui-canvas-text-blue"><Zap className="w-4 h-4" /></div>
                        <div><div className="ui-canvas-list-item-title truncate">Command Action</div><div className="text-xs text-zinc-500">DB Execution</div></div>
                    </div>
                </div>

                <div
                    className="ui-canvas-list-item cursor-grab hover:border-green-500 scale-95"
                    onDragStart={(event) => onDragStart(event, 'logic')}
                    draggable
                >
                    <div className="ui-canvas-list-item-content">
                        <div className="ui-canvas-list-item-icon ui-canvas-bg-green ui-canvas-text-green"><ArrowRightLeft className="w-4 h-4" /></div>
                        <div><div className="ui-canvas-list-item-title truncate">Logic Gate</div><div className="text-xs text-zinc-500">Branching conditions</div></div>
                    </div>
                </div>

                <div
                    className="ui-canvas-list-item cursor-grab hover:border-purple-500 scale-95"
                    onDragStart={(event) => onDragStart(event, 'brain')}
                    draggable
                >
                    <div className="ui-canvas-list-item-content">
                        <div className="ui-canvas-list-item-icon ui-canvas-bg-fuchsia ui-canvas-text-fuchsia"><Cpu className="w-4 h-4" /></div>
                        <div><div className="ui-canvas-list-item-title truncate">AI Brain</div><div className="text-xs text-zinc-500">Vertex AI Processing</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
