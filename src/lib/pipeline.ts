import { RecordingMode, TranscriptSegment } from '@/types';
import { llmRouter, LLMResponse } from './llm';
import {
    getSystemPrompt,
    getChunkSummaryPrompt,
    getMergePrompt,
    getVerificationPrompt,
    getCleanupPrompt,
    getTitlePrompt,
} from './prompts';

const CHUNK_SIZE_SECONDS = 300; // 5 minutes
const CHUNK_OVERLAP_SECONDS = 30; // 30 second overlap

interface ProcessingResult {
    title: string;
    summary: string;
    content: string;
    keyPoints: string[];
    decisions: { text: string; timestamp: string; verified: boolean }[];
    actionItems: { task: string; owner: string | null; dueDate: string | null; timestamp: string }[];
    highlights: { quote: string; speaker: string; timestamp: string }[];
    revisitPoints: { timestamp: string; reason: string }[];
    uncertainties: { text: string; type: 'unclear' | 'conflict'; timestamp: string }[];
    contextSummary: string;
    tokensUsed: number;
    cost: number;
}

export async function processTranscript(
    transcript: string,
    segments: TranscriptSegment[],
    mode: RecordingMode,
    duration: number
): Promise<ProcessingResult> {
    let totalTokens = 0;
    let totalCost = 0;

    // Step 1: Clean up transcript
    const cleanedTranscript = await cleanupTranscript(transcript);
    totalTokens += cleanedTranscript.tokensUsed;
    totalCost += cleanedTranscript.cost;

    // Step 2: Chunk if needed
    const chunks = chunkTranscript(segments, CHUNK_SIZE_SECONDS, CHUNK_OVERLAP_SECONDS);

    // Step 3: Summarize each chunk
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i]
            .map((s) => `[${formatTime(s.start)}] ${s.speaker}: ${s.text}`)
            .join('\n');

        const summary = await summarizeChunk(chunkText, mode, i, chunks.length);
        chunkSummaries.push(summary.content);
        totalTokens += summary.tokensUsed;
        totalCost += summary.cost;
    }

    // Step 4: Merge summaries
    const mergedNotes = await mergeSummaries(chunkSummaries, mode);
    totalTokens += mergedNotes.tokensUsed;
    totalCost += mergedNotes.cost;

    // Step 5: Generate title
    const titleResult = await generateTitle(transcript, mode);
    totalTokens += titleResult.tokensUsed;
    totalCost += titleResult.cost;

    // Step 6: Verification pass
    const verification = await verifyNotes(mergedNotes.content, transcript);
    totalTokens += verification.tokensUsed;
    totalCost += verification.cost;

    // Parse the merged notes into structured components
    const parsed = parseStructuredNotes(mergedNotes.content);

    return {
        title: titleResult.content.trim(),
        summary: parsed.summary,
        content: mergedNotes.content,
        keyPoints: parsed.keyPoints,
        decisions: parsed.decisions,
        actionItems: parsed.actionItems,
        highlights: parsed.highlights,
        revisitPoints: parsed.revisitPoints,
        uncertainties: parsed.uncertainties,
        contextSummary: parsed.contextSummary,
        tokensUsed: totalTokens,
        cost: totalCost,
    };
}

async function cleanupTranscript(transcript: string): Promise<LLMResponse> {
    // For short transcripts, skip cleanup to save tokens
    if (transcript.length < 1000) {
        return { content: transcript, model: 'skip', tokensUsed: 0, cost: 0 };
    }

    return llmRouter.complete([
        { role: 'system', content: 'You clean up transcripts while preserving meaning.' },
        { role: 'user', content: getCleanupPrompt(transcript) },
    ], { maxTokens: 4096 });
}

async function summarizeChunk(
    chunkText: string,
    mode: RecordingMode,
    index: number,
    total: number
): Promise<LLMResponse> {
    return llmRouter.complete([
        { role: 'system', content: getSystemPrompt(mode) },
        { role: 'user', content: getChunkSummaryPrompt(chunkText, mode, index, total) },
    ], { maxTokens: 2048 });
}

async function mergeSummaries(
    summaries: string[],
    mode: RecordingMode
): Promise<LLMResponse> {
    // If only one chunk, return it directly
    if (summaries.length === 1) {
        return { content: summaries[0], model: 'skip', tokensUsed: 0, cost: 0 };
    }

    return llmRouter.complete([
        { role: 'system', content: getSystemPrompt(mode) },
        { role: 'user', content: getMergePrompt(summaries, mode) },
    ], { maxTokens: 4096 });
}

async function generateTitle(
    transcript: string,
    mode: RecordingMode
): Promise<LLMResponse> {
    return llmRouter.complete([
        { role: 'system', content: 'You generate concise, descriptive titles.' },
        { role: 'user', content: getTitlePrompt(transcript, mode) },
    ], { maxTokens: 50 });
}

async function verifyNotes(
    notes: string,
    transcript: string
): Promise<LLMResponse> {
    return llmRouter.complete([
        { role: 'system', content: 'You verify notes against transcripts for accuracy.' },
        { role: 'user', content: getVerificationPrompt(notes, transcript.slice(0, 8000)) },
    ], { maxTokens: 1024 });
}

function chunkTranscript(
    segments: TranscriptSegment[],
    chunkSize: number,
    overlap: number
): TranscriptSegment[][] {
    if (segments.length === 0) return [];

    const chunks: TranscriptSegment[][] = [];
    let currentChunk: TranscriptSegment[] = [];
    let chunkStart = segments[0].start;

    for (const segment of segments) {
        // Check if we need to start a new chunk
        if (segment.start - chunkStart >= chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            // Start new chunk with overlap
            const overlapStart = segment.start - overlap;
            currentChunk = currentChunk.filter((s) => s.end > overlapStart);
            chunkStart = segment.start - (currentChunk.length > 0 ? overlap : 0);
        }
        currentChunk.push(segment);
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function parseStructuredNotes(content: string): {
    summary: string;
    keyPoints: string[];
    decisions: { text: string; timestamp: string; verified: boolean }[];
    actionItems: { task: string; owner: string | null; dueDate: string | null; timestamp: string }[];
    highlights: { quote: string; speaker: string; timestamp: string }[];
    revisitPoints: { timestamp: string; reason: string }[];
    uncertainties: { text: string; type: 'unclear' | 'conflict'; timestamp: string }[];
    contextSummary: string;
} {
    // Basic parsing - extract sections from markdown
    const summaryMatch = content.match(/\*\*Summary\*\*:\s*(.+?)(?:\n|$)/);
    const keyPointsMatch = content.match(/## Key Points\n([\s\S]*?)(?=##|$)/);
    const decisionsMatch = content.match(/## Decisions\n([\s\S]*?)(?=##|$)/);
    const actionItemsMatch = content.match(/## Action Items\n([\s\S]*?)(?=##|$)/);
    const highlightsMatch = content.match(/## Highlights\n([\s\S]*?)(?=##|$)/);
    const revisitMatch = content.match(/## What to Revisit\n([\s\S]*?)(?=##|$)/);
    const uncertaintiesMatch = content.match(/## Uncertainties & Conflicts\n([\s\S]*?)(?=##|$)/);

    return {
        summary: summaryMatch?.[1]?.trim() || 'No summary available',
        keyPoints: extractBulletPoints(keyPointsMatch?.[1] || ''),
        decisions: extractDecisions(decisionsMatch?.[1] || ''),
        actionItems: extractActionItems(actionItemsMatch?.[1] || ''),
        highlights: extractHighlights(highlightsMatch?.[1] || ''),
        revisitPoints: extractRevisitPoints(revisitMatch?.[1] || ''),
        uncertainties: extractUncertainties(uncertaintiesMatch?.[1] || ''),
        contextSummary: content,
    };
}

function extractBulletPoints(text: string): string[] {
    return text
        .split('\n')
        .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map((line) => line.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
}

function extractDecisions(text: string): { text: string; timestamp: string; verified: boolean }[] {
    const lines = extractBulletPoints(text);
    return lines.map((line) => {
        const timestampMatch = line.match(/\[(\d{2}:\d{2}(?::\d{2})?)\]/);
        return {
            text: line.replace(/\[(\d{2}:\d{2}(?::\d{2})?)\]/g, '').trim(),
            timestamp: timestampMatch?.[1] || '',
            verified: true,
        };
    });
}

function extractActionItems(text: string): { task: string; owner: string | null; dueDate: string | null; timestamp: string }[] {
    // Try to parse markdown table format
    const rows = text.split('\n').filter((line) => line.includes('|') && !line.includes('---'));
    if (rows.length > 1) {
        return rows.slice(1).map((row) => {
            const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
            return {
                task: cells[0] || '',
                owner: cells[1] === '[unassigned]' ? null : cells[1] || null,
                dueDate: cells[2] === '[no date]' ? null : cells[2] || null,
                timestamp: cells[3]?.replace(/[\[\]]/g, '') || '',
            };
        }).filter((item) => item.task);
    }
    return [];
}

function extractHighlights(text: string): { quote: string; speaker: string; timestamp: string }[] {
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
        const quoteMatch = line.match(/"([^"]+)"/);
        const speakerMatch = line.match(/— (Speaker \d+|[A-Za-z\s]+)/);
        const timestampMatch = line.match(/\[(\d{2}:\d{2}(?::\d{2})?)\]/);
        return {
            quote: quoteMatch?.[1] || line,
            speaker: speakerMatch?.[1] || '',
            timestamp: timestampMatch?.[1] || '',
        };
    }).filter((h) => h.quote);
}

function extractRevisitPoints(text: string): { timestamp: string; reason: string }[] {
    const lines = text.split('\n').filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'));
    return lines.map((line) => {
        const timestampMatch = line.match(/\[(\d{2}:\d{2}(?::\d{2})?)\]/);
        return {
            timestamp: timestampMatch?.[1] || '',
            reason: line.replace(/^[-*]\s*/, '').replace(/\*\*\[[\d:]+\]\*\*\s*[-–]\s*/, '').trim(),
        };
    }).filter((r) => r.timestamp);
}

function extractUncertainties(text: string): { text: string; type: 'unclear' | 'conflict'; timestamp: string }[] {
    const lines = text.split('\n').filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'));
    return lines.map((line) => {
        const isConflict = line.toLowerCase().includes('[conflict]') || line.toLowerCase().includes('conflict');
        const timestampMatch = line.match(/\[(\d{2}:\d{2}(?::\d{2})?)\]/);
        return {
            text: line.replace(/^[-*]\s*/, '').replace(/\*\*\[(unclear|conflict)\]\*\*/gi, '').trim(),
            type: isConflict ? 'conflict' as 'conflict' : 'unclear' as 'unclear',
            timestamp: timestampMatch?.[1] || '',
        };
    }).filter((u) => u.text);
}
