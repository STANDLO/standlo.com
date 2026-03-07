import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowRightLeft } from 'lucide-react';

export default function LogicNode({ data, selected }: { data: Record<string, unknown>, selected: boolean }) {
    return (
        <div className={`shadow-md rounded-md bg-white dark:bg-zinc-800 border-2 ${selected ? 'border-green-500 shadow-green-500/20' : 'border-[#e3e8ee] dark:border-zinc-700'} min-w-[200px]`}>
            <Handle type="target" position={Position.Left} className="w-2 h-4 bg-green-500 rounded-sm border-none shadow-sm" />
            <div className="flex flex-col">
                <div className="px-3 py-2 bg-green-50 dark:bg-green-900/30 border-b border-[#e3e8ee] dark:border-zinc-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                        <ArrowRightLeft className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{String(data.label || 'Logic Gate')}</span>
                </div>
                <div className="p-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="font-mono text-zinc-800 dark:text-green-400 break-all">{String(data.condition || 'Add condition...')}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} id="true" className="w-2 h-3 bg-green-500 rounded-sm top-1/3 border-none shadow-sm" />
            <Handle type="source" position={Position.Right} id="false" className="w-2 h-3 bg-red-400 rounded-sm top-2/3 border-none shadow-sm" />
        </div>
    );
}
