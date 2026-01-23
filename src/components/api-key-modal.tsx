'use client';

import { useState, useEffect } from 'react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { Key, Lock, CheckCircle, ExternalLink, X } from 'lucide-react';

export default function ApiKeyModal() {
    const { keys, saveKeys, isLoaded, hasKeys } = useApiKeys();
    const [isOpen, setIsOpen] = useState(false);
    const [tempKeys, setTempKeys] = useState({
        groq: '',
        openRouter: '',
        assemblyAi: '' // Optional
    });

    // Show modal automatically if no keys are found after loading
    // But only once per session or if explicit? 
    // Let's rely on a small "Settings" button trigger primarily, 
    // but maybe auto-show on first visit if no keys?
    // User requested: "first time they initialize... get instructions"
    useEffect(() => {
        if (isLoaded && !hasKeys) {
            // Check if we've already dismissed it this session
            const dismissed = sessionStorage.getItem('apikey_modal_dismissed');
            if (!dismissed) {
                setIsOpen(true);
            }
        }
    }, [isLoaded, hasKeys]);

    const handleSave = () => {
        saveKeys({
            groqApiKey: tempKeys.groq,
            openRouterApiKey: tempKeys.openRouter,
            assemblyAiApiKey: tempKeys.assemblyAi
        });
        setIsOpen(false);
    };

    const handleDismiss = () => {
        setIsOpen(false);
        sessionStorage.setItem('apikey_modal_dismissed', 'true');
    };

    if (!isOpen) {
        // Render a small floater or settings button?
        // Actually, let's just expose the modal. The parent layout can render a trigger button.
        // For now, this component manages its own visibility based on logic.
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 p-3 bg-gray-800/80 backdrop-blur-md rounded-full border border-gray-700 hover:bg-gray-700 transition-all z-50 text-gray-400 hover:text-white"
                title="API Key Settings"
            >
                <Key className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gray-800/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Setup API Keys</h2>
                                <p className="text-sm text-gray-400">Bring your own AI keys to start recording</p>
                            </div>
                        </div>
                        <button onClick={handleDismiss} className="text-gray-500 hover:text-white transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Groq (Primary) */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                            <span>Groq API Key (Recommended)</span>
                            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 flex items-center gap-1 hover:underline">
                                Get Free Key <ExternalLink className="w-3 h-3" />
                            </a>
                        </label>
                        <input
                            type="password"
                            placeholder="gsk_..."
                            value={tempKeys.groq}
                            onChange={(e) => setTempKeys({ ...tempKeys, groq: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        />
                        <p className="text-xs text-gray-500">Used for insanely fast transcription and Llama 3 inference. Generous free tier.</p>
                    </div>

                    {/* OpenRouter (Fallback) */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                            <span>OpenRouter Key (Optional)</span>
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 flex items-center gap-1 hover:underline">
                                Get Key <ExternalLink className="w-3 h-3" />
                            </a>
                        </label>
                        <input
                            type="password"
                            placeholder="sk-or-..."
                            value={tempKeys.openRouter}
                            onChange={(e) => setTempKeys({ ...tempKeys, openRouter: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                        <p className="text-xs text-gray-500">Access strictly smarter models like DeepSeek R1 or Gemini 1.5 Pro.</p>
                    </div>

                    {/* AssemblyAI (Transcription) */}
                    {/* Only show this if they really need it, often WebSpeech is enough for live. But for upload, useful. */}
                    <div className="space-y-2 opacity-80 hover:opacity-100 transition">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                            <span>AssemblyAI Key (Optional)</span>
                            <a href="https://www.assemblyai.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 flex items-center gap-1 hover:underline">
                                Get Key <ExternalLink className="w-3 h-3" />
                            </a>
                        </label>
                        <input
                            type="password"
                            placeholder="Standard API Key"
                            value={tempKeys.assemblyAi}
                            onChange={(e) => setTempKeys({ ...tempKeys, assemblyAi: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition"
                        />
                        <p className="text-xs text-gray-500">Needed for high-accuracy File Upload transcription.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-gray-800 transition"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!tempKeys.groq && !tempKeys.openRouter}
                        className="flex-1 px-4 py-3 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Save Keys
                    </button>
                </div>
            </div>
        </div>
    );
}
