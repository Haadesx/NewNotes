'use client';

import { useState } from 'react';
import { Speaker, TranscriptSegment } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { Edit2, Check, AlertTriangle } from 'lucide-react';

interface TranscriptViewerProps {
    content: string;
    segments: TranscriptSegment[];
    speakers: Speaker[];
    onSpeakerRename?: (speakerId: string, newLabel: string) => void;
    onTimestampClick?: (seconds: number) => void;
}

export default function TranscriptViewer({
    content,
    segments,
    speakers,
    onSpeakerRename,
    onTimestampClick,
}: TranscriptViewerProps) {
    const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');

    const getSpeakerInfo = (speakerId: string) => {
        return speakers.find((s) => s.id === speakerId) || {
            id: speakerId,
            label: speakerId,
            color: '#888888',
        };
    };

    const handleStartEdit = (speaker: Speaker) => {
        setEditingSpeaker(speaker.id);
        setEditLabel(speaker.label);
    };

    const handleSaveEdit = () => {
        if (editingSpeaker && onSpeakerRename) {
            onSpeakerRename(editingSpeaker, editLabel);
        }
        setEditingSpeaker(null);
        setEditLabel('');
    };

    return (
        <div className="space-y-6">
            {/* Speaker Legend */}
            <div className="flex flex-wrap gap-2 p-4 bg-gray-800/50 rounded-xl">
                <span className="text-sm text-gray-400 mr-2">Speakers:</span>
                {speakers.map((speaker) => (
                    <div
                        key={speaker.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700/50"
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: speaker.color }}
                        />
                        {editingSpeaker === speaker.id ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    className="w-24 px-2 py-0.5 text-sm bg-gray-600 rounded border-none outline-none"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                />
                                <button
                                    onClick={handleSaveEdit}
                                    className="p-1 hover:bg-gray-600 rounded"
                                >
                                    <Check className="w-3 h-3 text-green-400" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="text-sm text-white">{speaker.label}</span>
                                {onSpeakerRename && (
                                    <button
                                        onClick={() => handleStartEdit(speaker)}
                                        className="p-1 hover:bg-gray-600 rounded opacity-50 hover:opacity-100"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Transcript Segments */}
            <div className="space-y-4">
                {segments.map((segment, index) => {
                    const speaker = getSpeakerInfo(segment.speaker);
                    return (
                        <div
                            key={index}
                            className={`
                p-4 rounded-xl transition-all duration-200
                ${segment.uncertain ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-800/50'}
              `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Speaker Indicator */}
                                <div
                                    className="w-1 self-stretch rounded-full flex-shrink-0"
                                    style={{ backgroundColor: speaker.color }}
                                />

                                <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            onClick={() => onTimestampClick?.(segment.start)}
                                            className="text-xs font-mono text-blue-400 hover:text-blue-300 transition"
                                        >
                                            [{formatTimestamp(segment.start)}]
                                        </button>
                                        <span
                                            className="text-sm font-medium"
                                            style={{ color: speaker.color }}
                                        >
                                            {speaker.label}
                                        </span>
                                        {segment.uncertain && (
                                            <span className="flex items-center gap-1 text-xs text-yellow-400">
                                                <AlertTriangle className="w-3 h-3" />
                                                uncertain speaker
                                            </span>
                                        )}
                                    </div>

                                    {/* Text */}
                                    <p className="text-gray-200 leading-relaxed">{segment.text}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
