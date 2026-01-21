'use client';

import { RecordingMode } from '@/types';
import { RECORDING_MODES } from '@/lib/utils';

interface ModeSelectorProps {
    value: RecordingMode;
    onChange: (mode: RecordingMode) => void;
    disabled?: boolean;
}

export default function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(RECORDING_MODES) as [RecordingMode, typeof RECORDING_MODES.meeting][]).map(
                ([key, mode]) => (
                    <button
                        key={key}
                        onClick={() => !disabled && onChange(key)}
                        disabled={disabled}
                        className={`
              relative p-5 rounded-2xl text-left transition-all duration-300
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${value === key
                                ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                                : 'bg-gray-800/50 hover:bg-gray-800 hover:shadow-md'
                            }
            `}
                    >
                        {/* Icon */}
                        <span className="text-3xl">{mode.icon}</span>

                        {/* Label */}
                        <h3 className="text-lg font-semibold text-white mt-3">{mode.label}</h3>

                        {/* Description */}
                        <p className="text-sm text-gray-400 mt-1 leading-snug">{mode.description}</p>

                        {/* Active Indicator */}
                        {value === key && (
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                    </button>
                )
            )}
        </div>
    );
}
