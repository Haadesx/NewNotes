'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioUpload from '@/components/audio-upload';
import UsageDisplay from '@/components/usage-display';
import { UsageStats, Recording } from '@/types';
import { FileAudio, ChevronRight, Clock, Loader2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RECORDING_MODES } from '@/lib/utils';

export default function HomePage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string>('');
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get or create session ID
        let id = localStorage.getItem('notes_session_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('notes_session_id', id);
        }
        setSessionId(id);

        // Load recordings and usage
        loadData(id);
    }, []);

    const loadData = async (sid: string) => {
        try {
            const res = await fetch(`/api/upload?sessionId=${sid}`);
            const data = await res.json();
            setRecordings(data.recordings || []);
            setUsage(data.usage);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = (recordingId: string) => {
        router.push(`/note/${recordingId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">AudioNotes</h1>
                            <p className="text-xs text-gray-500">AI-powered audio transcription</p>
                        </div>
                    </div>

                    {usage && (
                        <div className="hidden md:block w-64">
                            <UsageDisplay usage={usage} />
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Transform Audio into
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Structured Notes</span>
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Upload any recording — meeting, lecture, interview, or brainstorm — and get
                        clean, verified notes with speaker labels and timestamps in minutes.
                    </p>
                </div>

                {/* Mobile Usage */}
                {usage && (
                    <div className="md:hidden mb-8">
                        <UsageDisplay usage={usage} />
                    </div>
                )}

                {/* Upload Section */}
                <div className="bg-gray-900/50 rounded-3xl border border-gray-800 p-8 mb-6">
                    <AudioUpload onUploadComplete={handleUploadComplete} sessionId={sessionId} />
                </div>

                {/* Or divider */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-800" />
                </div>

                {/* Live Recording CTA */}
                <button
                    onClick={() => router.push('/live')}
                    className="w-full p-6 mb-12 bg-gradient-to-r from-red-900/30 to-pink-900/30 hover:from-red-900/50 hover:to-pink-900/50
                        rounded-2xl border border-red-500/30 hover:border-red-500/50
                        flex items-center justify-center gap-4 transition-all duration-300 group"
                >
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition">
                        <span className="text-2xl">🎙️</span>
                    </div>
                    <div className="text-left">
                        <p className="text-lg font-semibold text-white">Start Live Recording</p>
                        <p className="text-sm text-gray-400">Real-time transcription and notes as you speak</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-red-400 group-hover:translate-x-1 transition" />
                </button>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <FeatureCard
                        icon="🎯"
                        title="Anti-Hallucination"
                        description="Every claim is verified against the transcript with timestamp citations"
                    />
                    <FeatureCard
                        icon="🆓"
                        title="Free to Try"
                        description="60 minutes per month free, no credit card required"
                    />
                    <FeatureCard
                        icon="⚡"
                        title="Cost-Optimized"
                        description="Uses free-tier AI models first, only upgrading when needed"
                    />
                </div>

                {/* Recent Recordings */}
                {!loading && recordings.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Recent Notes</h3>
                        <div className="grid gap-3">
                            {recordings.map((recording) => (
                                <button
                                    key={recording.id}
                                    onClick={() => router.push(`/note/${recording.id}`)}
                                    className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 
                    flex items-center gap-4 transition-all duration-200 text-left group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center">
                                        <span className="text-2xl">
                                            {RECORDING_MODES[recording.mode as keyof typeof RECORDING_MODES]?.icon || '📝'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {recording.originalName}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="capitalize">{recording.mode}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={recording.status} />
                                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800/50 py-8 mt-12">
                <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
                    <p>AudioNotes — AI-powered audio transcription with anti-hallucination guarantees</p>
                    <p className="mt-1">Free tier: 60 min/month • Max 10 min per recording</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <span className="text-3xl">{icon}</span>
            <h4 className="text-lg font-semibold text-white mt-3">{title}</h4>
            <p className="text-sm text-gray-400 mt-2">{description}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs = {
        pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
        processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Processing' },
        completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Complete' },
        failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
