'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { RecordingMode } from '@/types';

interface LiveNote {
    timestamp: number;
    content: string;
    keyPoints: string[];
    isProcessing: boolean;
}

interface UseLiveNotesResult {
    notes: LiveNote[];
    currentSummary: string;
    isProcessing: boolean;
    error: string | null;
    processTranscript: (text: string, mode: RecordingMode) => Promise<void>;
}

export function useLiveNotes(mode: RecordingMode): UseLiveNotesResult {
    const [notes, setNotes] = useState<LiveNote[]>([]);
    const [currentSummary, setCurrentSummary] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const accumulatedTextRef = useRef<string>('');
    const lastProcessedLengthRef = useRef<number>(0);
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    const { keys } = useApiKeys();

    const processTranscript = useCallback(async (newText: string, currentMode: RecordingMode) => {
        accumulatedTextRef.current = newText;

        // Only process if we have significant new content (at least 100 chars since last process)
        const newContentLength = newText.length - lastProcessedLengthRef.current;
        if (newContentLength < 100) return;

        // Debounce processing
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }

        processingTimeoutRef.current = setTimeout(async () => {
            if (isProcessing) return;

            setIsProcessing(true);
            setError(null);

            try {
                // Prepare headers
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (keys.groqApiKey) headers['x-groq-key'] = keys.groqApiKey;
                if (keys.openRouterApiKey) headers['x-openrouter-key'] = keys.openRouterApiKey;

                const response = await fetch('/api/live-notes', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        transcript: accumulatedTextRef.current,
                        mode: currentMode,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate notes');
                }

                const data = await response.json();

                setCurrentSummary(data.summary || '');

                if (data.keyPoints?.length > 0) {
                    const newNote: LiveNote = {
                        timestamp: Date.now(),
                        content: data.summary,
                        keyPoints: data.keyPoints,
                        isProcessing: false,
                    };
                    setNotes(prev => [...prev, newNote]);
                }

                lastProcessedLengthRef.current = accumulatedTextRef.current.length;
            } catch (err) {
                console.error('Live notes error:', err);
                setError(err instanceof Error ? err.message : 'Processing failed');
            } finally {
                setIsProcessing(false);
            }
        }, 2000); // Wait 2 seconds after last change before processing
    }, [isProcessing]);

    useEffect(() => {
        return () => {
            if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
            }
        };
    }, []);

    return {
        notes,
        currentSummary,
        isProcessing,
        error,
        processTranscript,
    };
}
