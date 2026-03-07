import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export default function ActionNode({ data, selected }: { data: Record<string, unknown>, selected: boolean }) {
    return (
        <div className={`shadow-md rounded-md bg-white dark:bg-zinc-800 border-2 ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-[#e3e8ee] dark:border-zinc-700'} min-w-[200px]`}>
            <Handle type="target" position={Position.Left} className="w-2 h-4 bg-blue-500 rounded-sm border-none shadow-sm" />
            <div className="flex flex-col">
                <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-[#e3e8ee] dark:border-zinc-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        <Zap className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{String(data.label || 'Action')}</span>
                </div>
                <div className="p-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="font-mono text-zinc-800 dark:text-zinc-200">{String(data.actionType || 'Configure...')}</div>
                    {!!data.targetPath && <div className="text-[10px] mt-1 break-all text-zinc-500 font-mono">{String(data.targetPath)}</div>}
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-2 h-4 bg-blue-500 rounded-sm border-none shadow-sm" />
        </div>
    );
}
