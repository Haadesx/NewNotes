import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jsPDF from 'jspdf';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const format = request.nextUrl.searchParams.get('format') || 'markdown';

        const recording = await prisma.recording.findUnique({
            where: { id },
            include: {
                transcript: true,
                note: true,
            },
        });

        if (!recording || !recording.note) {
            return NextResponse.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        if (format === 'pdf') {
            // Generate PDF
            const doc = new jsPDF();
            const note = recording.note;

            // Title
            doc.setFontSize(20);
            doc.text(note.title, 20, 20);

            // Summary
            doc.setFontSize(12);
            doc.text(`Summary: ${note.summary}`, 20, 35);

            // Content (simplified - would need proper text wrapping for production)
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(note.content.replace(/[#*]/g, ''), 170);
            doc.text(lines, 20, 50);

            const pdfBuffer = doc.output('arraybuffer');

            return new NextResponse(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
                },
            });
        }

        // Default: Markdown
        let markdown = recording.note.content;

        // Optionally include transcript
        if (request.nextUrl.searchParams.get('includeTranscript') === 'true' && recording.transcript) {
            markdown = `${markdown}\n\n---\n\n# Full Transcript\n\n${recording.transcript.content}`;
        }

        return new NextResponse(markdown, {
            headers: {
                'Content-Type': 'text/markdown',
                'Content-Disposition': `attachment; filename="${recording.note.title.replace(/[^a-z0-9]/gi, '_')}.md"`,
            },
        });
    } catch (error) {
        console.error('Error exporting:', error);
        return NextResponse.json(
            { error: 'Failed to export' },
            { status: 500 }
        );
    }
}
