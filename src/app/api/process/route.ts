import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { transcribeWithDiarization, mockTranscription } from '@/lib/transcription';
import { processTranscript } from '@/lib/pipeline';
import { recordUsage } from '@/lib/usage';
import { RecordingMode } from '@/types';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
    try {
        const { recordingId, sessionId } = await request.json();

        if (!recordingId) {
            return NextResponse.json(
                { error: 'Recording ID required' },
                { status: 400 }
            );
        }

        // Get recording
        const recording = await prisma.recording.findUnique({
            where: { id: recordingId },
        });

        if (!recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        // Update status to processing
        await prisma.recording.update({
            where: { id: recordingId },
            data: { status: 'processing' },
        });

        try {
            // Step 1: Transcribe with diarization
            let diarizationResult;

            if (process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_key_here') {
                // Use real AssemblyAI transcription
                const audioPath = join(UPLOAD_DIR, recording.filename);
                // For AssemblyAI, we need to upload the file or use a URL
                // In production, you'd upload to a cloud storage and get a URL
                // For now, we'll use mock for local development
                diarizationResult = mockTranscription(recording.duration || 180);
            } else {
                // Use mock for development
                diarizationResult = mockTranscription(recording.duration || 180);
            }

            // Update recording with actual duration
            await prisma.recording.update({
                where: { id: recordingId },
                data: { duration: Math.floor(diarizationResult.duration) },
            });

            // Step 2: Create transcript record
            const transcript = await prisma.transcript.create({
                data: {
                    recordingId,
                    content: diarizationResult.transcript,
                    speakers: JSON.stringify(diarizationResult.speakers),
                    segments: JSON.stringify(diarizationResult.segments),
                },
            });

            // Step 3: Process with LLM
            let noteResult;

            if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_key_here') {
                noteResult = await processTranscript(
                    diarizationResult.transcript,
                    diarizationResult.segments,
                    recording.mode as RecordingMode,
                    diarizationResult.duration
                );
            } else {
                // Mock result for development without API keys
                noteResult = {
                    title: 'Sample Meeting Notes',
                    summary: 'A productive discussion about project timelines and deliverables.',
                    content: generateMockNotes(recording.mode as RecordingMode),
                    keyPoints: ['Discussed project timeline', 'Aligned on deliverables'],
                    decisions: [{ text: 'Proceed with Option A', timestamp: '00:45', verified: true }],
                    actionItems: [{ task: 'Finalize designs', owner: 'Speaker 1', dueDate: null, timestamp: '01:30' }],
                    highlights: [{ quote: 'We need to focus on quality', speaker: 'Speaker 1', timestamp: '00:30' }],
                    revisitPoints: [{ timestamp: '00:45', reason: 'Important decision discussion' }],
                    uncertainties: [],
                    contextSummary: 'The meeting focused on aligning the team on project priorities.',
                    tokensUsed: 0,
                    cost: 0,
                };
            }

            // Step 4: Create note record
            const note = await prisma.note.create({
                data: {
                    recordingId,
                    title: noteResult.title,
                    summary: noteResult.summary,
                    content: noteResult.content,
                    keyPoints: JSON.stringify(noteResult.keyPoints),
                    decisions: JSON.stringify(noteResult.decisions),
                    actionItems: JSON.stringify(noteResult.actionItems),
                    highlights: JSON.stringify(noteResult.highlights),
                    revisitPoints: JSON.stringify(noteResult.revisitPoints),
                    uncertainties: JSON.stringify(noteResult.uncertainties),
                    contextSummary: noteResult.contextSummary,
                },
            });

            // Step 5: Record usage
            if (sessionId) {
                await recordUsage(
                    sessionId,
                    recordingId,
                    diarizationResult.duration / 60,
                    'pipeline',
                    noteResult.cost,
                    noteResult.tokensUsed
                );
            }

            // Step 6: Update recording status
            await prisma.recording.update({
                where: { id: recordingId },
                data: { status: 'completed' },
            });

            return NextResponse.json({
                success: true,
                recordingId,
                transcriptId: transcript.id,
                noteId: note.id,
                title: noteResult.title,
                summary: noteResult.summary,
            });
        } catch (processingError) {
            console.error('Processing error:', processingError);

            await prisma.recording.update({
                where: { id: recordingId },
                data: {
                    status: 'failed',
                    errorMessage: processingError instanceof Error ? processingError.message : 'Processing failed',
                },
            });

            return NextResponse.json(
                { error: 'Processing failed', details: processingError instanceof Error ? processingError.message : 'Unknown error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Process error:', error);
        return NextResponse.json(
            { error: 'Failed to process recording' },
            { status: 500 }
        );
    }
}

function generateMockNotes(mode: RecordingMode): string {
    const templates: Record<RecordingMode, string> = {
        meeting: `# Sample Meeting Notes

**Summary**: Team aligned on Q1 priorities and project timeline.

---

## Key Points

### Project Roadmap
- Discussed the main project timeline **[00:15]**
- Speaker 2 proposed focusing on core deliverables first **[00:45]**

---

## Decisions
- **Proceed with Option A**: Approved by team **[00:45]**

---

## Action Items
| Task | Owner | Due Date | Timestamp |
|------|-------|----------|-----------|
| Finalize designs | Speaker 1 | [no date] | [01:30] |
| Review timeline | [unassigned] | [no date] | [00:45] |

---

## Highlights
1. "We need to focus on quality" — Speaker 1 **[00:30]**

---

## What to Revisit
- **[00:45]** - Decision discussion about implementation approach

---

## Uncertainties & Conflicts
No major uncertainties or conflicts detected.`,

        lecture: `# Sample Lecture Notes

**Summary**: Overview of key concepts and their practical applications.

---

## Main Concepts
- **Concept 1**: Introduced at the start **[00:15]**
- **Concept 2**: Explained with examples **[00:45]**

---

## Definitions
- **Term A**: Definition provided by speaker **[00:30]**

---

## Examples
- Example demonstrating Concept 1 **[01:00]**

---

## Study Structure
1. Start with fundamentals
2. Build on core concepts
3. Apply through practice`,

        interview: `# Sample Interview Notes

**Summary**: Insightful discussion with thoughtful responses.

---

## Q&A Structure

### Question 1 [00:15]
**Q**: Opening question about background
**A**: Detailed response about experience...

### Question 2 [00:45]
**Q**: Follow-up question
**A**: Expanded on previous point...

---

## Key Insights
- Emphasized importance of fundamentals **[00:30]**

---

## Pull Quotes
> "The key is consistent practice" — Interviewee **[01:00]**`,

        brainstorm: `# Sample Brainstorm Notes

**Summary**: Creative session generating multiple ideas for consideration.

---

## Ideas Generated

### Theme 1: Core Ideas
- Idea A: Mentioned first **[00:15]**
- Idea B: Built on Idea A **[00:30]**

### Theme 2: Extensions
- Idea C: Novel approach **[00:45]**

---

## Next Steps
- Evaluate top 3 ideas **[01:30]**
- Schedule follow-up session

---

## Parking Lot
- Items to revisit: Additional considerations noted for later`,
    };

    return templates[mode];
}
