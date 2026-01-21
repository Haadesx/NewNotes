// Utility functions for the audio notes app

// Generate a unique session ID for anonymous users
export function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = localStorage.getItem('notes_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('notes_session_id', sessionId);
    }
    return sessionId;
}

// Format seconds to timestamp string (MM:SS or HH:MM:SS)
export function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Parse timestamp string to seconds
export function parseTimestamp(timestamp: string): number {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return parts[0] * 60 + parts[1];
}

// Speaker colors for consistent styling
export const SPEAKER_COLORS = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
];

export function getSpeakerColor(index: number): string {
    return SPEAKER_COLORS[index % SPEAKER_COLORS.length];
}

// Format duration for display
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

// Validate audio file type
export function isValidAudioFile(file: File): boolean {
    const validTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/m4a',
        'audio/x-m4a',
        'audio/mp4',
        'audio/webm',
        'audio/ogg',
    ];
    return validTypes.includes(file.type) ||
        file.name.endsWith('.mp3') ||
        file.name.endsWith('.wav') ||
        file.name.endsWith('.m4a') ||
        file.name.endsWith('.webm') ||
        file.name.endsWith('.ogg');
}

// Get file size in human readable format
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Recording modes configuration
export const RECORDING_MODES = {
    meeting: {
        label: 'Meeting',
        description: 'Decisions, action items, owners, follow-ups',
        icon: '👥',
    },
    lecture: {
        label: 'Lecture',
        description: 'Concepts, definitions, examples, study structure',
        icon: '📚',
    },
    interview: {
        label: 'Interview',
        description: 'Q/A structure, highlights, pull quotes',
        icon: '🎤',
    },
    brainstorm: {
        label: 'Brainstorm',
        description: 'Ideas clustered, pros/cons if stated, next steps',
        icon: '💡',
    },
} as const;
