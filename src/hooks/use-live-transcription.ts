'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface TranscriptSegment {
    text: string;
    start: number;
    end: number;
    speaker?: number;
    isFinal: boolean;
}

interface UseLiveTranscriptionResult {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    transcript: TranscriptSegment[];
    interimText: string;
    connect: (audioStream: MediaStream) => Promise<void>;
    disconnect: () => void;
    clearTranscript: () => void;
}

export function useLiveTranscription(): UseLiveTranscriptionResult {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [interimText, setInterimText] = useState('');

    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);
    // Use a ref to track if we should keep running (avoids stale closure issue)
    const shouldRestartRef = useRef<boolean>(false);

    const connect = useCallback(async (audioStream: MediaStream) => {
        setIsConnecting(true);
        setError(null);
        startTimeRef.current = Date.now();
        shouldRestartRef.current = true;

        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                throw new Error('Speech recognition not supported in this browser');
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsConnected(true);
                setIsConnecting(false);
            };

            recognition.onresult = (event: any) => {
                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const text = result[0].transcript;

                    if (result.isFinal) {
                        const segment: TranscriptSegment = {
                            text: text.trim(),
                            start: (Date.now() - startTimeRef.current) / 1000 - 2,
                            end: (Date.now() - startTimeRef.current) / 1000,
                            isFinal: true,
                        };
                        setTranscript(prev => [...prev, segment]);
                        setInterimText('');
                    } else {
                        interim += text;
                    }
                }

                if (interim) {
                    setInterimText(interim);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    setError(`Recognition error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                // Only auto-restart if shouldRestartRef is true (not stopped by user)
                if (shouldRestartRef.current && recognitionRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Recognition restart failed:', e);
                    }
                } else {
                    setIsConnected(false);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start transcription');
            setIsConnecting(false);
            shouldRestartRef.current = false;
        }
    }, []);

    const disconnect = useCallback(() => {
        // Set flag BEFORE stopping to prevent auto-restart
        shouldRestartRef.current = false;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.log('Stop failed:', e);
            }
            recognitionRef.current = null;
        }
        setIsConnected(false);
        setInterimText('');
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript([]);
        setInterimText('');
    }, []);

    useEffect(() => {
        return () => {
            shouldRestartRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore
                }
            }
        };
    }, []);

    return {
        isConnected,
        isConnecting,
        error,
        transcript,
        interimText,
        connect,
        disconnect,
        clearTranscript,
    };
}


