'use client';

import { useCallback, useState } from 'react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, X, Loader2 } from 'lucide-react';
import { isValidAudioFile, formatFileSize, RECORDING_MODES } from '@/lib/utils';
import { RecordingMode } from '@/types';

interface AudioUploadProps {
    onUploadComplete: (recordingId: string) => void;
    sessionId: string;
}

export default function AudioUpload({ onUploadComplete, sessionId }: AudioUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<RecordingMode>('meeting');
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string>('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const audioFile = acceptedFiles[0];
        if (audioFile) {
            if (isValidAudioFile(audioFile)) {
                setFile(audioFile);
                setError(null);
            } else {
                setError('Invalid file type. Please upload an audio file (mp3, wav, m4a, webm, ogg).');
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.mp3', '.wav', '.m4a', '.webm', '.ogg'],
        },
        maxFiles: 1,
    });


    // Use the hook to get keys
    const { keys } = useApiKeys();

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setProgress('Uploading...');

        try {
            // Step 1: Upload file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mode', mode);
            formData.append('sessionId', sessionId);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const data = await uploadRes.json();
                throw new Error(data.error || 'Upload failed');
            }

            const uploadData = await uploadRes.json();
            setProgress('Processing audio...');
            setUploading(false);
            setProcessing(true);

            // Step 2: Process the recording
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (keys.groqApiKey) headers['x-groq-key'] = keys.groqApiKey;
            if (keys.openRouterApiKey) headers['x-openrouter-key'] = keys.openRouterApiKey;
            if (keys.assemblyAiApiKey) headers['x-assemblyai-key'] = keys.assemblyAiApiKey;

            const processRes = await fetch('/api/process', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    recordingId: uploadData.id,
                    sessionId,
                }),
            });

            if (!processRes.ok) {
                const data = await processRes.json();
                throw new Error(data.error || 'Processing failed');
            }

            const processData = await processRes.json();
            setProcessing(false);
            onUploadComplete(processData.recordingId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setUploading(false);
            setProcessing(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setError(null);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isDragActive
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }
          ${file ? 'border-green-500 bg-green-500/10' : ''}
        `}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                            <FileAudio className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-white">{file.name}</p>
                            <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); clearFile(); }}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-700 transition"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-lg text-white">
                                {isDragActive ? 'Drop your audio file here' : 'Drag & drop your audio file'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                or click to browse • MP3, WAV, M4A, WebM, OGG
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Mode Selector */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Recording Type</label>
                <div className="grid grid-cols-2 gap-3">
                    {(Object.entries(RECORDING_MODES) as [RecordingMode, typeof RECORDING_MODES.meeting][]).map(
                        ([key, value]) => (
                            <button
                                key={key}
                                onClick={() => setMode(key)}
                                className={`
                  p-4 rounded-xl text-left transition-all duration-200
                  ${mode === key
                                        ? 'bg-blue-600 ring-2 ring-blue-400'
                                        : 'bg-gray-800 hover:bg-gray-700'
                                    }
                `}
                            >
                                <span className="text-2xl">{value.icon}</span>
                                <p className="font-medium text-white mt-2">{value.label}</p>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{value.description}</p>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || uploading || processing}
                className={`
          w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200
          flex items-center justify-center gap-3
          ${file && !uploading && !processing
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }
        `}
            >
                {(uploading || processing) && <Loader2 className="w-5 h-5 animate-spin" />}
                {uploading ? 'Uploading...' : processing ? progress : 'Generate Notes'}
            </button>
        </div>
    );
}
