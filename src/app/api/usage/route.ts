import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUsageQuota, getUsageStats } from '@/lib/usage';

export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID required' },
                { status: 400 }
            );
        }

        const quota = await getOrCreateUsageQuota(sessionId);
        const stats = await getUsageStats(sessionId);

        return NextResponse.json({
            quota,
            stats,
        });
    } catch (error) {
        console.error('Error fetching usage:', error);
        return NextResponse.json(
            { error: 'Failed to fetch usage' },
            { status: 500 }
        );
    }
}
