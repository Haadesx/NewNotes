import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { getOrCreateUsageQuota, canProcessRecording } from '@/lib/usage';
import { isValidAudioFile } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const mode = (formData.get('mode') as string) || 'meeting';
        const sessionId = formData.get('sessionId') as string;

        // Validate file
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!isValidAudioFile(file)) {
            return NextResponse.json(
                { error: 'Invalid file type. Supported: mp3, wav, m4a, webm, ogg' },
                { status: 400 }
            );
        }

        // Check file size (100MB max)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size: 100MB' },
                { status: 400 }
            );
        }

        // For now, we'll estimate duration from file size (rough estimate)
        // In production, we'd get actual duration from audio metadata
        const estimatedDuration = Math.floor(file.size / (128 * 1024 / 8)); // Assuming 128kbps

        // Check usage quota
        if (sessionId) {
            const quotaCheck = await canProcessRecording(sessionId, estimatedDuration);
            if (!quotaCheck.allowed) {
                return NextResponse.json(
                    { error: quotaCheck.reason },
                    { status: 429 }
                );
            }
        }

        // Ensure upload directory exists
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Generate unique filename
        const fileId = uuidv4();
        const ext = file.name.split('.').pop() || 'mp3';
        const filename = `${fileId}.${ext}`;
        const filepath = join(UPLOAD_DIR, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Create database record
        const recording = await prisma.recording.create({
            data: {
                filename,
                originalName: file.name,
                mode,
                status: 'pending',
                duration: estimatedDuration,
            },
        });

        return NextResponse.json({
            id: recording.id,
            filename: recording.filename,
            originalName: recording.originalName,
            mode: recording.mode,
            status: recording.status,
            estimatedDuration,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    // Get recent recordings
    const recordings = await prisma.recording.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
            note: {
                select: {
                    id: true,
                    title: true,
                    summary: true,
                },
            },
        },
    });

    // Get usage stats
    let usage = null;
    if (sessionId) {
        usage = await getOrCreateUsageQuota(sessionId);
    }

    return NextResponse.json({
        recordings,
        usage,
    });
}
