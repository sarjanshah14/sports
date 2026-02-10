import { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Mock data structure matching the design
type Participant = {
    id: string;
    name: string;
    score?: number;
    isWinner?: boolean;
};

type MatchData = {
    id: string;
    round: string;
    matchNumber: number;
    participantA?: Participant;
    participantB?: Participant;
    status: 'scheduled' | 'active' | 'completed';
};

export default memo(({ data }: { data: MatchData }) => {
    return (
        <div className="w-64 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-slate-400" />

            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Match {data.matchNumber}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">{data.round}</span>
            </div>

            <div className="p-3 space-y-2">
                {/* Participant A */}
                <div className={`flex justify-between items-center ${data.participantA?.isWinner ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    <div className="flex items-center gap-2">
                        {/* Avatar placeholder */}
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                            {data.participantA?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm truncate max-w-[100px]">{data.participantA?.name || 'TBD'}</span>
                    </div>
                    <span className="text-sm">{data.participantA?.score ?? '-'}</span>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-700" />

                {/* Participant B */}
                <div className={`flex justify-between items-center ${data.participantB?.isWinner ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                            {data.participantB?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm truncate max-w-[100px]">{data.participantB?.name || 'TBD'}</span>
                    </div>
                    <span className="text-sm">{data.participantB?.score ?? '-'}</span>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-slate-400" />
        </div>
    );
});
