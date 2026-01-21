'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '@/types';
import {
    CheckCircle2,
    Clock,
    User,
    MessageSquare,
    AlertCircle,
    Bookmark,
    RefreshCw
} from 'lucide-react';

interface NotesViewerProps {
    note: Note;
    onTimestampClick?: (timestamp: string) => void;
}

export default function NotesViewer({ note, onTimestampClick }: NotesViewerProps) {
    const handleTimestampClick = (timestamp: string) => {
        onTimestampClick?.(timestamp);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">{note.title}</h1>
                <p className="text-lg text-gray-400">{note.summary}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
                    label="Decisions"
                    value={note.decisions.length}
                />
                <StatCard
                    icon={<Clock className="w-5 h-5 text-blue-400" />}
                    label="Action Items"
                    value={note.actionItems.length}
                />
                <StatCard
                    icon={<Bookmark className="w-5 h-5 text-purple-400" />}
                    label="Highlights"
                    value={note.highlights.length}
                />
                <StatCard
                    icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}
                    label="Uncertainties"
                    value={note.uncertainties.length}
                />
            </div>

            {/* Decisions */}
            {note.decisions.length > 0 && (
                <Section title="Decisions" icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}>
                    <div className="space-y-3">
                        {note.decisions.map((decision, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-white">{decision.text}</p>
                                    {decision.timestamp && (
                                        <button
                                            onClick={() => handleTimestampClick(decision.timestamp)}
                                            className="text-xs text-green-400 hover:text-green-300 mt-1 font-mono"
                                        >
                                            [{decision.timestamp}]
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Action Items */}
            {note.actionItems.length > 0 && (
                <Section title="Action Items" icon={<Clock className="w-5 h-5 text-blue-400" />}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                                    <th className="pb-3 font-medium">Task</th>
                                    <th className="pb-3 font-medium">Owner</th>
                                    <th className="pb-3 font-medium">Due</th>
                                    <th className="pb-3 font-medium">Ref</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {note.actionItems.map((item, i) => (
                                    <tr key={i} className="text-sm">
                                        <td className="py-3 pr-4 text-white">{item.task}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                        ${item.owner ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-700 text-gray-400'}
                      `}>
                                                <User className="w-3 h-3" />
                                                {item.owner || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${item.dueDate ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-700 text-gray-400'}
                      `}>
                                                {item.dueDate || 'No date'}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {item.timestamp && (
                                                <button
                                                    onClick={() => handleTimestampClick(item.timestamp)}
                                                    className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                                                >
                                                    [{item.timestamp}]
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {/* Highlights */}
            {note.highlights.length > 0 && (
                <Section title="Highlights" icon={<Bookmark className="w-5 h-5 text-purple-400" />}>
                    <div className="space-y-3">
                        {note.highlights.map((highlight, i) => (
                            <div key={i} className="p-4 bg-purple-500/10 rounded-xl border-l-4 border-purple-500">
                                <p className="text-white italic">"{highlight.quote}"</p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                                    {highlight.speaker && <span>— {highlight.speaker}</span>}
                                    {highlight.timestamp && (
                                        <button
                                            onClick={() => handleTimestampClick(highlight.timestamp)}
                                            className="text-purple-400 hover:text-purple-300 font-mono"
                                        >
                                            [{highlight.timestamp}]
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* What to Revisit */}
            {note.revisitPoints.length > 0 && (
                <Section title="What to Revisit" icon={<RefreshCw className="w-5 h-5 text-orange-400" />}>
                    <div className="space-y-2">
                        {note.revisitPoints.map((point, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
                                <button
                                    onClick={() => handleTimestampClick(point.timestamp)}
                                    className="text-orange-400 hover:text-orange-300 font-mono font-bold"
                                >
                                    [{point.timestamp}]
                                </button>
                                <span className="text-gray-300">{point.reason}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Uncertainties & Conflicts */}
            {note.uncertainties.length > 0 && (
                <Section title="Uncertainties & Conflicts" icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}>
                    <div className="space-y-2">
                        {note.uncertainties.map((item, i) => (
                            <div
                                key={i}
                                className={`
                  flex items-start gap-3 p-3 rounded-lg
                  ${item.type === 'conflict' ? 'bg-red-500/10' : 'bg-yellow-500/10'}
                `}
                            >
                                <span className={`
                  text-xs font-bold uppercase px-2 py-0.5 rounded
                  ${item.type === 'conflict' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'}
                `}>
                                    {item.type}
                                </span>
                                <p className="text-gray-300 flex-1">{item.text}</p>
                                {item.timestamp && (
                                    <button
                                        onClick={() => handleTimestampClick(item.timestamp)}
                                        className="text-xs text-gray-400 hover:text-gray-300 font-mono"
                                    >
                                        [{item.timestamp}]
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Full Content */}
            <Section title="Full Notes" icon={<MessageSquare className="w-5 h-5 text-gray-400" />}>
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {note.content}
                    </ReactMarkdown>
                </div>
            </Section>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-sm text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

function Section({
    title,
    icon,
    children
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                {icon}
                <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            {children}
        </div>
    );
}
