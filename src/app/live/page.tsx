'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMicrophone } from '@/hooks/use-microphone';
import { useLiveTranscription } from '@/hooks/use-live-transcription';
import { useLiveNotes } from '@/hooks/use-live-notes';
import ModeSelector from '@/components/mode-selector';
import { RecordingMode } from '@/types';
import {
    ArrowLeft,
    Mic,
    Square,
    Loader2,
    Sparkles,
    FileText,
    AlertCircle,
    Clock,
    Download,
    RotateCcw,
    FileType
} from 'lucide-react';

export default function LiveRecordingPage() {
    const router = useRouter();
    const [mode, setMode] = useState<RecordingMode>('meeting');
    const [recordingTime, setRecordingTime] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [isStopped, setIsStopped] = useState(false);

    const {
        isRecording,
        isSupported,
        error: micError,
        audioStream,
        startRecording,
        stopRecording: stopMic,
        audioLevel
    } = useMicrophone();

    const {
        isConnected,
        isConnecting,
        error: transcriptError,
        transcript,
        interimText,
        connect,
        disconnect,
        clearTranscript,
    } = useLiveTranscription();

    const {
        notes,
        currentSummary,
        isProcessing,
        error: notesError,
        processTranscript,
    } = useLiveNotes(mode);

    // Timer for recording duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && !isStopped) {
            interval = setInterval(() => {
                setRecordingTime(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, isStopped]);

    // Process transcript when it updates
    useEffect(() => {
        const fullText = transcript.map(s => s.text).join(' ');
        if (fullText.length > 0 && !isStopped) {
            processTranscript(fullText, mode);
        }
    }, [transcript, mode, processTranscript, isStopped]);

    const handleStart = useCallback(async () => {
        setHasStarted(true);
        setIsStopped(false);
        setRecordingTime(0);
        await startRecording();
    }, [startRecording]);

    // Connect transcription when audio stream is available
    useEffect(() => {
        if (audioStream && !isConnected && !isConnecting && !isStopped) {
            connect(audioStream);
        }
    }, [audioStream, isConnected, isConnecting, connect, isStopped]);

    const handleStop = useCallback(() => {
        setIsStopped(true);
        stopMic();
        disconnect();
    }, [stopMic, disconnect]);

    const handleNewRecording = useCallback(() => {
        setHasStarted(false);
        setIsStopped(false);
        setRecordingTime(0);
        clearTranscript();
    }, [clearTranscript]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Download functions
    const downloadMarkdown = useCallback(() => {
        const fullTranscript = transcript.map(s =>
            `[${formatTime(Math.floor(s.start))}] ${s.text}`
        ).join('\n');

        const allKeyPoints = notes.flatMap(n => n.keyPoints);

        const content = `# Live Recording Notes
**Mode:** ${mode.charAt(0).toUpperCase() + mode.slice(1)}
**Duration:** ${formatTime(recordingTime)}
**Date:** ${new Date().toLocaleDateString()}

## Summary
${currentSummary || 'No summary generated.'}

## Key Points
${allKeyPoints.length > 0 ? allKeyPoints.map(p => `- ${p}`).join('\n') : 'No key points captured.'}

---

## Full Transcript
${fullTranscript || 'No transcript recorded.'}
`;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `live-notes-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [transcript, notes, currentSummary, mode, recordingTime]);

    const downloadText = useCallback(() => {
        const fullTranscript = transcript.map(s =>
            `[${formatTime(Math.floor(s.start))}] ${s.text}`
        ).join('\n');

        const allKeyPoints = notes.flatMap(n => n.keyPoints);

        const content = `LIVE RECORDING NOTES
Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}
Duration: ${formatTime(recordingTime)}
Date: ${new Date().toLocaleDateString()}

SUMMARY
${currentSummary || 'No summary generated.'}

KEY POINTS
${allKeyPoints.length > 0 ? allKeyPoints.map(p => `• ${p}`).join('\n') : 'No key points captured.'}

---

FULL TRANSCRIPT
${fullTranscript || 'No transcript recorded.'}
`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `live-notes-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [transcript, notes, currentSummary, mode, recordingTime]);

    const error = micError || transcriptError || notesError;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 rounded-lg hover:bg-gray-800 transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                                <Mic className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white">Live Recording</h1>
                                <p className="text-sm text-gray-500">Real-time transcription & notes</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {(isRecording || isStopped) && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isStopped ? 'bg-gray-700' : 'bg-red-500/20'
                                }`}>
                                {!isStopped && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                <span className={`font-mono text-sm ${isStopped ? 'text-gray-300' : 'text-red-400'}`}>
                                    {formatTime(recordingTime)}
                                </span>
                            </div>
                        )}

                        {/* Download buttons shown when stopped */}
                        {isStopped && transcript.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={downloadMarkdown}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition"
                                >
                                    <FileType className="w-4 h-4" />
                                    .md
                                </button>
                                <button
                                    onClick={downloadText}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition"
                                >
                                    <Download className="w-4 h-4" />
                                    .txt
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {!isSupported && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-300">Your browser doesn't support microphone access</span>
                    </div>
                )}

                {error && (
                    <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-300">{error}</span>
                    </div>
                )}

                {/* Pre-recording: Mode Selection */}
                {!hasStarted && (
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-white">Start Live Recording</h2>
                            <p className="text-gray-400 max-w-xl mx-auto">
                                Choose your recording type, then click start. Your transcript and notes will appear in real-time.
                            </p>
                        </div>

                        <ModeSelector value={mode} onChange={setMode} disabled={false} />

                        <div className="flex justify-center">
                            <button
                                onClick={handleStart}
                                disabled={!isSupported}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 
                                    hover:from-red-500 hover:to-pink-500 rounded-2xl text-white font-semibold text-lg
                                    shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50"
                            >
                                <Mic className="w-6 h-6" />
                                Start Recording
                            </button>
                        </div>
                    </div>
                )}

                {/* Recording View */}
                {hasStarted && (
                    <div className="space-y-6">
                        {/* Control Bar */}
                        <div className="flex items-center justify-center gap-4">
                            {!isStopped ? (
                                <>
                                    <div className="relative">
                                        <button
                                            onClick={handleStop}
                                            className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                                                bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/50"
                                        >
                                            <Square className="w-8 h-8 text-white fill-white" />
                                        </button>
                                        {isRecording && (
                                            <div
                                                className="absolute inset-0 rounded-full border-4 border-red-400 opacity-50 animate-ping"
                                                style={{
                                                    transform: `scale(${1 + audioLevel * 0.5})`,
                                                    opacity: 0.3 + audioLevel * 0.5
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">
                                            {isConnecting ? 'Connecting...' : 'Recording'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Click to stop</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                        <span className="text-green-400 font-medium">Recording Complete</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-300">{formatTime(recordingTime)}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleNewRecording}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 
                                                rounded-lg text-white transition"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            New Recording
                                        </button>
                                        <button
                                            onClick={downloadMarkdown}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 
                                                rounded-lg text-white transition"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Notes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Split View: Transcript + Notes */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Live Transcript */}
                            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 min-h-[400px]">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-lg font-semibold text-white">
                                        {isStopped ? 'Transcript' : 'Live Transcript'}
                                    </h3>
                                    {isConnected && !isStopped && (
                                        <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
                                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                            Live
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {transcript.length === 0 && !interimText ? (
                                        <p className="text-gray-500 text-center py-8">
                                            {!isStopped ? 'Listening... Start speaking!' : 'No transcript recorded'}
                                        </p>
                                    ) : (
                                        <>
                                            {transcript.map((segment, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <span className="text-xs text-gray-500 font-mono shrink-0">
                                                        [{formatTime(Math.floor(segment.start))}]
                                                    </span>
                                                    <p className="text-gray-200">{segment.text}</p>
                                                </div>
                                            ))}
                                            {interimText && !isStopped && (
                                                <div className="flex gap-2 opacity-60">
                                                    <span className="text-xs text-gray-500 font-mono shrink-0">
                                                        <Clock className="w-3 h-3 inline animate-pulse" />
                                                    </span>
                                                    <p className="text-gray-400 italic">{interimText}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Live Notes */}
                            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 min-h-[400px]">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-lg font-semibold text-white">
                                        {isStopped ? 'Notes' : 'Live Notes'}
                                    </h3>
                                    {isProcessing && !isStopped && (
                                        <Loader2 className="w-4 h-4 ml-auto text-purple-400 animate-spin" />
                                    )}
                                </div>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                    {notes.length === 0 && !currentSummary ? (
                                        <p className="text-gray-500 text-center py-8">
                                            {!isStopped ? 'Notes will be generated as you speak' : 'No notes generated'}
                                        </p>
                                    ) : (
                                        <>
                                            {currentSummary && (
                                                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                                    <p className="text-purple-200 text-sm">{currentSummary}</p>
                                                </div>
                                            )}

                                            {notes.flatMap((note, i) =>
                                                note.keyPoints.map((point, j) => (
                                                    <div
                                                        key={`${i}-${j}`}
                                                        className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg"
                                                    >
                                                        <span className="text-purple-400">•</span>
                                                        <p className="text-gray-200 text-sm">{point}</p>
                                                    </div>
                                                ))
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
