import Groq from 'groq-sdk';

// Model configuration with cost tracking
interface ModelConfig {
    provider: 'groq' | 'openrouter';
    model: string;
    costPer1kTokens: number;
    maxTokens: number;
    description: string;
}

// Priority order: lowest cost first
const MODELS: ModelConfig[] = [
    {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        costPer1kTokens: 0,
        maxTokens: 32768,
        description: 'Free, fast, good quality',
    },
    {
        provider: 'groq',
        model: 'mixtral-8x7b-32768',
        costPer1kTokens: 0,
        maxTokens: 32768,
        description: 'Free, good for summarization',
    },
    {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        costPer1kTokens: 0,
        maxTokens: 8192,
        description: 'Free, very fast, lighter tasks',
    },
    {
        provider: 'openrouter',
        model: 'xiaomi/mimo-v2-flash:free',
        costPer1kTokens: 0,
        maxTokens: 262144,
        description: 'Free, 262K context, great quality',
    },
    {
        provider: 'openrouter',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        costPer1kTokens: 0,
        maxTokens: 131072,
        description: 'Free, 70B model fallback',
    },
    {
        provider: 'openrouter',
        model: 'google/gemini-2.0-flash-exp:free',
        costPer1kTokens: 0,
        maxTokens: 1048576,
        description: 'Free, huge context Gemini',
    },
    {
        provider: 'openrouter',
        model: 'deepseek/deepseek-r1-0528:free',
        costPer1kTokens: 0,
        maxTokens: 163840,
        description: 'Free DeepSeek R1 reasoning',
    },
    {
        provider: 'openrouter',
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        costPer1kTokens: 0,
        maxTokens: 131072,
        description: 'Free lightweight fallback',
    },
];

interface LLMResponse {
    content: string;
    model: string;
    tokensUsed: number;
    cost: number;
}

interface LLMOptions {
    preferQuality?: boolean;
    maxTokens?: number;
    temperature?: number;
    groqApiKey?: string;
    openRouterApiKey?: string;
}

class LLMRouter {
    // Cache the default client to avoid recreation if using env var
    private defaultGroqClient: Groq | null = null;

    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.defaultGroqClient = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        }
    }

    async complete(
        messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
        options: LLMOptions = {}
    ): Promise<LLMResponse> {
        const { preferQuality = false, maxTokens = 4096, temperature = 0.3 } = options;

        // Select models based on preference
        const modelsToTry = preferQuality
            ? [...MODELS].reverse()
            : MODELS;

        let lastError: Error | null = null;

        for (const modelConfig of modelsToTry) {
            try {
                if (modelConfig.provider === 'groq') {
                    return await this.callGroq(messages, modelConfig, maxTokens, temperature, options.groqApiKey);
                } else {
                    return await this.callOpenRouter(messages, modelConfig, maxTokens, temperature, options.openRouterApiKey);
                }
            } catch (error) {
                console.error(`Model ${modelConfig.model} failed:`, error);
                lastError = error as Error;
                continue;
            }
        }

        throw lastError || new Error('All models failed');
    }

    private async callGroq(
        messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
        config: ModelConfig,
        maxTokens: number,
        temperature: number,
        customKey?: string
    ): Promise<LLMResponse> {
        let client = this.defaultGroqClient;

        // If a custom key is provided, use it instead of the default client
        if (customKey) {
            client = new Groq({ apiKey: customKey });
        } else if (!client) {
            // No default client and no custom key
            if (process.env.GROQ_API_KEY) {
                client = new Groq({ apiKey: process.env.GROQ_API_KEY });
            } else {
                throw new Error('Groq API Key missing (env or custom)');
            }
        }

        const response = await client.chat.completions.create({
            model: config.model,
            messages,
            max_tokens: Math.min(maxTokens, config.maxTokens),
            temperature,
        });

        const tokensUsed = response.usage?.total_tokens || 0;
        const cost = (tokensUsed / 1000) * config.costPer1kTokens;

        return {
            content: response.choices[0]?.message?.content || '',
            model: config.model,
            tokensUsed,
            cost,
        };
    }

    private async callOpenRouter(
        messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
        config: ModelConfig,
        maxTokens: number,
        temperature: number,
        customKey?: string
    ): Promise<LLMResponse> {
        const apiKey = customKey || process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            throw new Error('OpenRouter API key not set');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                max_tokens: Math.min(maxTokens, config.maxTokens),
                temperature,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenRouter error: ${response.statusText}`);
        }

        const data = await response.json();
        const tokensUsed = data.usage?.total_tokens || 0;
        const cost = (tokensUsed / 1000) * config.costPer1kTokens;

        return {
            content: data.choices[0]?.message?.content || '',
            model: config.model,
            tokensUsed,
            cost,
        };
    }
}

export const llmRouter = new LLMRouter();
export { MODELS };
export type { LLMResponse, ModelConfig };

