'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMicrophoneResult {
    isRecording: boolean;
    isSupported: boolean;
    error: string | null;
    audioStream: MediaStream | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    audioLevel: number;
}

export function useMicrophone(): UseMicrophoneResult {
    const [isRecording, setIsRecording] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setIsSupported(false);
            setError('Your browser does not support microphone access');
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                },
            });

            // Set up audio analyser for level visualization
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            setAudioStream(stream);
            setIsRecording(true);
            updateAudioLevel();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to access microphone';
            setError(message);
            console.error('Microphone error:', err);
        }
    }, [updateAudioLevel]);

    const stopRecording = useCallback(() => {
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            setAudioStream(null);
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        analyserRef.current = null;
        setIsRecording(false);
        setAudioLevel(0);
    }, [audioStream]);

    return {
        isRecording,
        isSupported,
        error,
        audioStream,
        startRecording,
        stopRecording,
        audioLevel,
    };
}
