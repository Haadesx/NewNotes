'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
    GROQ: 'audionotes_groq_key',
    OPENROUTER: 'audionotes_openrouter_key',
    ASSEMBLYAI: 'audionotes_assemblyai_key',
};

interface ApiKeys {
    groqApiKey?: string;
    openRouterApiKey?: string;
    assemblyAiApiKey?: string;
}

export function useApiKeys() {
    const [keys, setKeys] = useState<ApiKeys>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load keys from localStorage on mount
        const groq = localStorage.getItem(STORAGE_KEYS.GROQ);
        const openRouter = localStorage.getItem(STORAGE_KEYS.OPENROUTER);
        const assemblyAi = localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI);

        setKeys({
            groqApiKey: groq || undefined,
            openRouterApiKey: openRouter || undefined,
            assemblyAiApiKey: assemblyAi || undefined,
        });
        setIsLoaded(true);
    }, []);

    const saveKeys = (newKeys: ApiKeys) => {
        if (newKeys.groqApiKey) localStorage.setItem(STORAGE_KEYS.GROQ, newKeys.groqApiKey);
        if (newKeys.openRouterApiKey) localStorage.setItem(STORAGE_KEYS.OPENROUTER, newKeys.openRouterApiKey);
        if (newKeys.assemblyAiApiKey) localStorage.setItem(STORAGE_KEYS.ASSEMBLYAI, newKeys.assemblyAiApiKey);

        setKeys((prev) => ({ ...prev, ...newKeys }));
    };

    const clearKeys = () => {
        localStorage.removeItem(STORAGE_KEYS.GROQ);
        localStorage.removeItem(STORAGE_KEYS.OPENROUTER);
        localStorage.removeItem(STORAGE_KEYS.ASSEMBLYAI);
        setKeys({});
    };

    const hasKeys = !!(keys.groqApiKey || keys.openRouterApiKey);

    // Check if we need keys (if no env vars are present - but we can't check env vars here easily without exposed public env)
    // We'll assume if no keys and we are in "public mode" (which we act like), we need them.
    // However, if the user doesn't strictly need them (e.g. running locally with .env), we shouldn't force it.
    // Strategy: The modal will show "Env keys detected" if configured? No, keep it simple.

    return {
        keys,
        saveKeys,
        clearKeys,
        isLoaded,
        hasKeys
    };
}
