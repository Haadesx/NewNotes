import { NextRequest, NextResponse } from 'next/server';
import { llmRouter } from '@/lib/llm';
import { RecordingMode } from '@/types';

const MODE_PROMPTS: Record<RecordingMode, string> = {
    meeting: 'Extract key decisions, action items, and important discussion points.',
    lecture: 'Identify main concepts, definitions, and examples being explained.',
    interview: 'Note key questions asked and significant answers given.',
    brainstorm: 'Capture ideas mentioned and any pros/cons discussed.',
};


export async function POST(request: NextRequest) {
    try {
        const { transcript, mode } = await request.json();

        // Extract API keys from headers
        const groqApiKey = request.headers.get('x-groq-key') || undefined;
        const openRouterApiKey = request.headers.get('x-openrouter-key') || undefined;

        if (!transcript || transcript.length < 50) {
            return NextResponse.json({
                summary: '',
                keyPoints: [],
            });
        }

        const systemPrompt = `You are a real-time note-taking assistant. Given a live transcript, extract the most important points concisely.

MODE: ${mode.toUpperCase()}
FOCUS: ${MODE_PROMPTS[mode as RecordingMode] || MODE_PROMPTS.meeting}

Rules:
- Be concise - this is live, so brevity matters
- Only include what's clearly stated
- Use bullet points
- Include timestamps if timing seems important`;

        const userPrompt = `LIVE TRANSCRIPT:
${transcript}

Generate a brief summary (1-2 sentences) and up to 5 key points. Respond in JSON:
{
  "summary": "brief summary",
  "keyPoints": ["point 1", "point 2", ...]
}`;

        const response = await llmRouter.complete(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            {
                maxTokens: 500,
                temperature: 0.3,
                groqApiKey,
                openRouterApiKey
            }
        );

        // Parse JSON response
        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return NextResponse.json({
                    summary: parsed.summary || '',
                    keyPoints: parsed.keyPoints || [],
                    model: response.model,
                    tokensUsed: response.tokensUsed,
                });
            }
        } catch (parseError) {
            console.error('Failed to parse LLM response:', parseError);
        }

        // Fallback: return raw content as summary
        return NextResponse.json({
            summary: response.content.slice(0, 200),
            keyPoints: [],
            model: response.model,
        });
    } catch (error) {
        console.error('Live notes error:', error);
        return NextResponse.json(
            { error: 'Failed to generate notes' },
            { status: 500 }
        );
    }
}
