import { AssemblyAI, TranscriptUtterance } from 'assemblyai';
import { TranscriptSegment, Speaker } from '@/types';
import { getSpeakerColor } from './utils';

// Initialize AssemblyAI client
const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

interface DiarizationResult {
    transcript: string;
    segments: TranscriptSegment[];
    speakers: Speaker[];
    duration: number;
}

export async function transcribeWithDiarization(
    audioUrl: string
): Promise<DiarizationResult> {
    // Submit for transcription with speaker diarization
    const transcript = await client.transcripts.transcribe({
        audio: audioUrl,
        speaker_labels: true,
        auto_highlights: true,
    });

    if (transcript.status === 'error') {
        throw new Error(transcript.error || 'Transcription failed');
    }

    // Extract unique speakers
    const speakerSet = new Set<string>();
    transcript.utterances?.forEach((u: TranscriptUtterance) => {
        if (u.speaker) speakerSet.add(u.speaker);
    });

    const speakers: Speaker[] = Array.from(speakerSet).map((id, index) => ({
        id,
        label: `Speaker ${index + 1}`,
        color: getSpeakerColor(index),
    }));

    // Convert utterances to segments
    const segments: TranscriptSegment[] = (transcript.utterances || []).map(
        (u: TranscriptUtterance) => ({
            start: u.start / 1000, // Convert ms to seconds
            end: u.end / 1000,
            speaker: u.speaker || 'unknown',
            text: u.text,
            confidence: u.confidence,
            uncertain: u.confidence < 0.7,
        })
    );

    // Build full transcript markdown
    const transcriptMarkdown = segments
        .map((s) => {
            const speakerLabel = speakers.find((sp) => sp.id === s.speaker)?.label || s.speaker;
            const timestamp = formatTimestamp(s.start);
            const uncertainMarker = s.uncertain ? ' [uncertain speaker]' : '';
            return `**[${timestamp}]** **${speakerLabel}${uncertainMarker}**: ${s.text}`;
        })
        .join('\n\n');

    return {
        transcript: transcriptMarkdown,
        segments,
        speakers,
        duration: (transcript.audio_duration || 0),
    };
}

function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${mins
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// For local development without AssemblyAI, we can use a mock
export function mockTranscription(duration: number): DiarizationResult {
    const speakers: Speaker[] = [
        { id: 'A', label: 'Speaker 1', color: getSpeakerColor(0) },
        { id: 'B', label: 'Speaker 2', color: getSpeakerColor(1) },
    ];

    const segments: TranscriptSegment[] = [
        {
            start: 0,
            end: 15,
            speaker: 'A',
            text: 'Welcome everyone to today\'s meeting. Let\'s get started with our agenda.',
            confidence: 0.95,
        },
        {
            start: 15,
            end: 45,
            speaker: 'B',
            text: 'Thanks for organizing this. I wanted to discuss the project timeline and make sure we\'re aligned on the deliverables.',
            confidence: 0.92,
        },
        {
            start: 45,
            end: 90,
            speaker: 'A',
            text: 'Absolutely. So the main decision we need to make today is whether to proceed with Option A or Option B for the implementation.',
            confidence: 0.88,
        },
    ];

    const transcriptMarkdown = segments
        .map((s) => {
            const speakerLabel = speakers.find((sp) => sp.id === s.speaker)?.label || s.speaker;
            const timestamp = formatTimestamp(s.start);
            return `**[${timestamp}]** **${speakerLabel}**: ${s.text}`;
        })
        .join('\n\n');

    return {
        transcript: transcriptMarkdown,
        segments,
        speakers,
        duration,
    };
}
