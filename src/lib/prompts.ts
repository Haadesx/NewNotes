import { RecordingMode } from '@/types';

// Base system prompt for all modes
const BASE_SYSTEM_PROMPT = `You are an expert note-taking assistant that converts audio transcripts into structured, trustworthy notes.

CRITICAL RULES:
1. Do NOT invent facts, speaker identities, decisions, action items, deadlines, or owners that are not in the transcript
2. Every non-obvious claim MUST include a timestamp citation in format [MM:SS] or [HH:MM:SS]
3. If something cannot be verified from the transcript, mark it as [uncertain] with the timestamp
4. Prefer bullet points and headings over long paragraphs
5. Preserve nuance and intent - don't oversimplify into generic fluff
6. If speakers disagree and the conflict is not resolved in the transcript, mark it as [conflict] with timestamps from both speakers`;

// Mode-specific prompts
const MODE_PROMPTS: Record<RecordingMode, string> = {
    meeting: `Focus on extracting:
- DECISIONS: Only include if clearly stated and agreed upon. Include who made/approved the decision.
- ACTION ITEMS: Task, owner (use "[unassigned]" if not stated), due date (use "[no date]" if not stated)
- FOLLOW-UPS: Items mentioned for future discussion
- KEY DISCUSSION POINTS: Major topics discussed, with speaker attributions when relevant`,

    lecture: `Focus on extracting:
- MAIN CONCEPTS: Core ideas and theories presented
- DEFINITIONS: Key terms and their explanations
- EXAMPLES: Concrete examples given to illustrate concepts
- STUDY STRUCTURE: How topics relate to each other
- IMPORTANT FORMULAS/FRAMEWORKS: Any structured knowledge presented`,

    interview: `Focus on extracting:
- Q&A STRUCTURE: Pair questions with their answers
- KEY INSIGHTS: Notable observations from the interviewee
- PULL QUOTES: Memorable or impactful statements (quoted exactly)
- THEMES: Recurring topics or patterns in responses
- FOLLOW-UP OPPORTUNITIES: Questions that could be explored further`,

    brainstorm: `Focus on extracting:
- IDEAS: All ideas mentioned, grouped by theme or category
- PROS/CONS: Only if explicitly stated by speakers - do NOT infer
- CONNECTIONS: How ideas relate to each other
- NEXT STEPS: Any action items or follow-ups mentioned
- PARKING LOT: Ideas noted but deferred for later`,
};

export function getSystemPrompt(mode: RecordingMode): string {
    return `${BASE_SYSTEM_PROMPT}

MODE: ${mode.toUpperCase()}
${MODE_PROMPTS[mode]}`;
}

export function getChunkSummaryPrompt(
    transcript: string,
    mode: RecordingMode,
    chunkIndex: number,
    totalChunks: number
): string {
    return `You are summarizing chunk ${chunkIndex + 1} of ${totalChunks} from a ${mode} recording.

TRANSCRIPT CHUNK:
${transcript}

Create a structured summary of this chunk. Include:
1. Key points with timestamp citations
2. Any decisions, action items, or important statements
3. Speaker attributions where relevant
4. Mark anything unclear as [uncertain]

Output as Markdown with clear headings.`;
}

export function getMergePrompt(
    chunkSummaries: string[],
    mode: RecordingMode
): string {
    return `You have ${chunkSummaries.length} chunk summaries from a ${mode} recording. Merge them into a single, coherent set of notes.

CHUNK SUMMARIES:
${chunkSummaries.map((s, i) => `--- CHUNK ${i + 1} ---\n${s}`).join('\n\n')}

REQUIREMENTS:
1. Preserve ALL decisions and action items - do not lose any
2. Maintain timestamp citations from the original chunks
3. Remove redundancy while preserving unique information
4. Create a logical flow that follows the recording's progression
5. Ensure late-recording content is not lost or de-prioritized

OUTPUT FORMAT:
# [Title based on content]

**Summary**: [One-line description of what the ${mode} was about]

## Key Points
[Grouped by topic with timestamps]

## Decisions
[If any, with timestamps]

## Action Items
| Task | Owner | Due Date | Timestamp |
|------|-------|----------|-----------|
[Only if any action items exist]

## Highlights
[Top 5 most important quotes/moments with timestamps]

## What to Revisit
[3 timestamps that are dense, unclear, or particularly important]

## Uncertainties & Conflicts
[Any unclear statements or speaker disagreements with timestamps]`;
}

export function getVerificationPrompt(notes: string, transcript: string): string {
    return `Verify these notes against the original transcript.

NOTES:
${notes}

TRANSCRIPT (for reference):
${transcript}

CHECK FOR:
1. Any claims in the notes that cannot be verified from the transcript
2. Missing timestamp citations for non-obvious claims
3. Action items or decisions that were invented (not in transcript)
4. Speaker attributions that don't match the transcript
5. Contradictions that were incorrectly "resolved" 

OUTPUT:
If issues found, output a JSON array:
[{"type": "hallucination"|"missing_citation"|"incorrect_attribution"|"false_resolution", "text": "...", "suggestion": "..."}]

If no issues, output:
[]`;
}

export function getCleanupPrompt(transcript: string): string {
    return `Clean up this transcript while preserving meaning and speaker labels.

TRANSCRIPT:
${transcript}

TASKS:
1. Remove filler words (um, uh, like, you know) unless they add meaning
2. Fix obvious transcription errors
3. Normalize punctuation and capitalization
4. Preserve speaker labels and timestamps
5. Do NOT change the meaning or remove content

Output the cleaned transcript in the same format.`;
}

export function getTitlePrompt(transcript: string, mode: RecordingMode): string {
    return `Based on this ${mode} transcript, suggest a concise, descriptive title (max 10 words).

TRANSCRIPT START:
${transcript.slice(0, 2000)}...

Output only the title, nothing else.`;
}
