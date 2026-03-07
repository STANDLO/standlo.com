import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export default function TriggerNode({ data, selected }: { data: Record<string, unknown>, selected: boolean }) {
    return (
        <div className={`shadow-md rounded-md bg-white dark:bg-zinc-800 border-2 ${selected ? 'border-indigo-500 shadow-indigo-500/20' : 'border-[#e3e8ee] dark:border-zinc-700'} min-w-[200px]`}>
            <div className="flex flex-col">
                <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-b border-[#e3e8ee] dark:border-zinc-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                        <Play className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{String(data.label || 'Trigger')}</span>
                </div>
                <div className="p-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="font-mono">{String(data.triggerType || 'Select trigger...')}</div>
                    {data.triggerType === 'firestore_event' && <div className="text-[10px] mt-1 break-all">/{String(data.collection || '...')}</div>}
                    {data.triggerType === 'schedule' && <div className="text-[10px] mt-1">{String(data.cron || '...')}</div>}
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-2 h-4 bg-indigo-500 rounded-sm border-none shadow-sm" />
        </div>
    );
}
