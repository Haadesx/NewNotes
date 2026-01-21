// Recording modes for the note-taking app
export type RecordingMode = 'meeting' | 'lecture' | 'interview' | 'brainstorm';

export type RecordingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Speaker {
    id: string;
    label: string;
    color: string;
}

export interface TranscriptSegment {
    start: number;      // seconds
    end: number;        // seconds
    speaker: string;    // speaker id
    text: string;
    confidence: number; // 0-1
    uncertain?: boolean;
}

export interface Decision {
    text: string;
    timestamp: string;
    verified: boolean;
}

export interface ActionItem {
    task: string;
    owner: string | null;      // null means [unassigned]
    dueDate: string | null;    // null means [no date]
    timestamp: string;
}

export interface Highlight {
    quote: string;
    speaker: string;
    timestamp: string;
}

export interface RevisitPoint {
    timestamp: string;
    reason: string;
}

export interface Uncertainty {
    text: string;
    type: 'unclear' | 'conflict';
    timestamp: string;
    relatedTimestamps?: string[];
}

export interface Recording {
    id: string;
    filename: string;
    originalName: string;
    duration: number | null;
    mode: RecordingMode;
    status: RecordingStatus;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Transcript {
    id: string;
    recordingId: string;
    content: string;
    speakers: Speaker[];
    segments: TranscriptSegment[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Note {
    id: string;
    recordingId: string;
    title: string;
    summary: string;
    content: string;
    keyPoints: string[];
    decisions: Decision[];
    actionItems: ActionItem[];
    highlights: Highlight[];
    revisitPoints: RevisitPoint[];
    uncertainties: Uncertainty[];
    contextSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UsageStats {
    minutesUsed: number;
    minutesLimit: number;
    maxRecordingLength: number;
    resetAt: Date;
}

// API response types
export interface ProcessingStatus {
    status: RecordingStatus;
    stage?: 'uploading' | 'diarizing' | 'transcribing' | 'summarizing' | 'verifying';
    progress?: number;
    errorMessage?: string;
}

export interface RecordingWithDetails extends Recording {
    transcript?: Transcript;
    note?: Note;
}
