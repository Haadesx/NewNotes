'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TranscriptViewer from '@/components/transcript-viewer';
import NotesViewer from '@/components/notes-viewer';
import { RecordingWithDetails, Speaker } from '@/types';
import {
    ArrowLeft,
    Download,
    FileText,
    FileType,
    Loader2,
    MessageSquare,
    SplitSquareHorizontal,
    AlertTriangle
} from 'lucide-react';
import { RECORDING_MODES } from '@/lib/utils';

type ViewMode = 'notes' | 'transcript' | 'split';

export default function NoteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [recording, setRecording] = useState<RecordingWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('notes');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadRecording(params.id as string);
        }
    }, [params.id]);

    const loadRecording = async (id: string) => {
        try {
            const res = await fetch(`/api/notes/${id}`);
            if (!res.ok) throw new Error('Failed to load recording');
            const data = await res.json();
            setRecording(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const handleSpeakerRename = async (speakerId: string, newLabel: string) => {
        if (!recording?.transcript) return;

        const updatedSpeakers = recording.transcript.speakers.map((s: Speaker) =>
            s.id === speakerId ? { ...s, label: newLabel } : s
        );

        try {
            await fetch(`/api/notes/${recording.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ speakers: updatedSpeakers }),
            });

            setRecording({
                ...recording,
                transcript: { ...recording.transcript, speakers: updatedSpeakers },
            });
        } catch (err) {
            console.error('Failed to rename speaker:', err);
        }
    };

    const handleExport = async (format: 'markdown' | 'pdf') => {
        if (!recording) return;
        setExporting(true);

        try {
            const res = await fetch(`/api/export/${recording.id}?format=${format}`);
            const blob = await res.blob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${recording.note?.title || 'notes'}.${format === 'pdf' ? 'pdf' : 'md'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error || !recording) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-white text-xl mb-2">Failed to load recording</p>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const modeInfo = RECORDING_MODES[recording.mode as keyof typeof RECORDING_MODES];

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <header className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{modeInfo?.icon}</span>
                                <div>
                                    <h1 className="text-lg font-semibold text-white">
                                        {recording.note?.title || recording.originalName}
                                    </h1>
                                    <p className="text-sm text-gray-500 capitalize">{recording.mode} • {recording.originalName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                <ViewToggle
                                    active={viewMode === 'notes'}
                                    onClick={() => setViewMode('notes')}
                                    icon={<FileText className="w-4 h-4" />}
                                    label="Notes"
                                />
                                <ViewToggle
                                    active={viewMode === 'transcript'}
                                    onClick={() => setViewMode('transcript')}
                                    icon={<MessageSquare className="w-4 h-4" />}
                                    label="Transcript"
                                />
                                <ViewToggle
                                    active={viewMode === 'split'}
                                    onClick={() => setViewMode('split')}
                                    icon={<SplitSquareHorizontal className="w-4 h-4" />}
                                    label="Split"
                                />
                            </div>

                            {/* Export Buttons */}
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => handleExport('markdown')}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition"
                                >
                                    <FileType className="w-4 h-4" />
                                    MD
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {recording.status === 'processing' && (
                    <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="text-blue-300">Processing your recording... This may take a few minutes.</span>
                    </div>
                )}

                {recording.status === 'failed' && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-red-300">{recording.errorMessage || 'Processing failed. Please try again.'}</span>
                    </div>
                )}

                {viewMode === 'split' ? (
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Notes
                            </h2>
                            {recording.note && <NotesViewer note={recording.note} />}
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Transcript
                            </h2>
                            {recording.transcript && (
                                <TranscriptViewer
                                    content={recording.transcript.content}
                                    segments={recording.transcript.segments}
                                    speakers={recording.transcript.speakers}
                                    onSpeakerRename={handleSpeakerRename}
                                />
                            )}
                        </div>
                    </div>
                ) : viewMode === 'notes' ? (
                    recording.note && <NotesViewer note={recording.note} />
                ) : (
                    recording.transcript && (
                        <TranscriptViewer
                            content={recording.transcript.content}
                            segments={recording.transcript.segments}
                            speakers={recording.transcript.speakers}
                            onSpeakerRename={handleSpeakerRename}
                        />
                    )
                )}
            </main>
        </div>
    );
}

function ViewToggle({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition
        ${active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}
      `}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
