'use client';

import { UsageStats } from '@/types';
import { formatDuration } from '@/lib/utils';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UsageDisplayProps {
    usage: UsageStats;
}

export default function UsageDisplay({ usage }: UsageDisplayProps) {
    const percentUsed = (usage.minutesUsed / usage.minutesLimit) * 100;
    const minutesRemaining = Math.max(0, usage.minutesLimit - usage.minutesUsed);

    return (
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Free Tier Usage
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Resets {formatDistanceToNow(new Date(usage.resetAt), { addSuffix: true })}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${percentUsed > 80
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : percentUsed > 50
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                : 'bg-gradient-to-r from-green-500 to-blue-500'
                        }`}
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                />
            </div>

            {/* Stats */}
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                    {usage.minutesUsed.toFixed(1)} / {usage.minutesLimit} min used
                </span>
                <span className={`font-medium ${minutesRemaining < 10 ? 'text-red-400' : 'text-green-400'}`}>
                    {minutesRemaining.toFixed(1)} min remaining
                </span>
            </div>

            {/* Limit Info */}
            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                Max {formatDuration(usage.maxRecordingLength)} per recording
            </div>
        </div>
    );
}
