'use client'

import React, { useCallback, useRef } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MatchNode from '@/components/bracket/match-node';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const nodeTypes = {
    match: MatchNode,
};

const initialNodes = [
    {
        id: '1',
        type: 'match',
        position: { x: 0, y: 0 },
        data: {
            id: '1',
            round: 'Round 1',
            matchNumber: 1,
            participantA: { id: 'p1', name: 'Team Alpha', score: 2, isWinner: true },
            participantB: { id: 'p2', name: 'Team Beta', score: 1 }
        }
    },
    {
        id: '2',
        type: 'match',
        position: { x: 0, y: 200 },
        data: {
            id: '2',
            round: 'Round 1',
            matchNumber: 2,
            participantA: { id: 'p3', name: 'Team Gamma', score: 0 },
            participantB: { id: 'p4', name: 'Team Delta', score: 3, isWinner: true }
        }
    },
    {
        id: '3',
        type: 'match',
        position: { x: 400, y: 100 },
        data: {
            id: '3',
            round: 'Final',
            matchNumber: 3,
            participantA: { id: 'p1', name: 'Team Alpha' },
            participantB: { id: 'p4', name: 'Team Delta' }
        }
    },
];
const initialEdges = [
    { id: 'e1-3', source: '1', target: '3', type: 'smoothstep' },
    { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' }
];

function BracketFlow() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const exportPdf = useCallback(() => {
        if (reactFlowWrapper.current) {
            // Find the react-flow__renderer div to capture
            const flowElement = reactFlowWrapper.current.querySelector('.react-flow__renderer') as HTMLElement;
            if (!flowElement) return;

            html2canvas(flowElement, { useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                });
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('tournament-bracket.pdf');
            });
        }
    }, []);

    return (
        <div className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col space-y-4">
            <div className="flex justify-end gap-2">
                <button onClick={exportPdf} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
}

export default function BracketPage() {
    return (
        <ReactFlowProvider>
            <BracketFlow />
        </ReactFlowProvider>
    )
}
