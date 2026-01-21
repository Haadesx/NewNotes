import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const recording = await prisma.recording.findUnique({
            where: { id },
            include: {
                transcript: true,
                note: true,
            },
        });

        if (!recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        // Parse JSON fields
        const response = {
            ...recording,
            transcript: recording.transcript
                ? {
                    ...recording.transcript,
                    speakers: JSON.parse(recording.transcript.speakers),
                    segments: JSON.parse(recording.transcript.segments),
                }
                : null,
            note: recording.note
                ? {
                    ...recording.note,
                    keyPoints: JSON.parse(recording.note.keyPoints),
                    decisions: JSON.parse(recording.note.decisions),
                    actionItems: JSON.parse(recording.note.actionItems),
                    highlights: JSON.parse(recording.note.highlights),
                    revisitPoints: JSON.parse(recording.note.revisitPoints),
                    uncertainties: JSON.parse(recording.note.uncertainties),
                }
                : null,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching note:', error);
        return NextResponse.json(
            { error: 'Failed to fetch note' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updates = await request.json();

        const recording = await prisma.recording.findUnique({
            where: { id },
            include: { note: true, transcript: true },
        });

        if (!recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        // Update note if provided
        if (updates.note && recording.note) {
            await prisma.note.update({
                where: { id: recording.note.id },
                data: {
                    title: updates.note.title ?? recording.note.title,
                    summary: updates.note.summary ?? recording.note.summary,
                    content: updates.note.content ?? recording.note.content,
                },
            });
        }

        // Update transcript speakers if provided (for renaming)
        if (updates.speakers && recording.transcript) {
            await prisma.transcript.update({
                where: { id: recording.transcript.id },
                data: {
                    speakers: JSON.stringify(updates.speakers),
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating note:', error);
        return NextResponse.json(
            { error: 'Failed to update note' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.recording.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json(
            { error: 'Failed to delete note' },
            { status: 500 }
        );
    }
}
