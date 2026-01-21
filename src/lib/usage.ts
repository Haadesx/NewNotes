import prisma from './prisma';
import { UsageStats } from '@/types';

const FREE_MINUTES_PER_MONTH = 60;
const MAX_RECORDING_LENGTH = 600; // 10 minutes in seconds

export async function getOrCreateUsageQuota(sessionId: string): Promise<UsageStats> {
    if (!sessionId) {
        return {
            minutesUsed: 0,
            minutesLimit: FREE_MINUTES_PER_MONTH,
            maxRecordingLength: MAX_RECORDING_LENGTH,
            resetAt: getNextResetDate(),
        };
    }

    let quota = await prisma.usageQuota.findUnique({
        where: { sessionId },
    });

    if (!quota) {
        quota = await prisma.usageQuota.create({
            data: {
                sessionId,
                minutesUsed: 0,
                minutesLimit: FREE_MINUTES_PER_MONTH,
                maxRecordingLength: MAX_RECORDING_LENGTH,
                resetAt: getNextResetDate(),
            },
        });
    }

    // Check if quota needs reset
    if (new Date() >= quota.resetAt) {
        quota = await prisma.usageQuota.update({
            where: { sessionId },
            data: {
                minutesUsed: 0,
                resetAt: getNextResetDate(),
            },
        });
    }

    return {
        minutesUsed: quota.minutesUsed,
        minutesLimit: quota.minutesLimit,
        maxRecordingLength: quota.maxRecordingLength,
        resetAt: quota.resetAt,
    };
}

export async function recordUsage(
    sessionId: string,
    recordingId: string,
    minutes: number,
    model: string,
    cost: number = 0,
    tokensUsed: number = 0
): Promise<void> {
    // Log the usage
    await prisma.usageLog.create({
        data: {
            sessionId,
            recordingId,
            minutes,
            model,
            cost,
            tokensUsed,
        },
    });

    // Update quota
    await prisma.usageQuota.update({
        where: { sessionId },
        data: {
            minutesUsed: { increment: minutes },
        },
    });
}

export async function canProcessRecording(
    sessionId: string,
    durationSeconds: number
): Promise<{ allowed: boolean; reason?: string }> {
    const quota = await getOrCreateUsageQuota(sessionId);
    const durationMinutes = durationSeconds / 60;

    if (durationSeconds > quota.maxRecordingLength) {
        return {
            allowed: false,
            reason: `Recording too long. Maximum allowed: ${Math.floor(quota.maxRecordingLength / 60)} minutes.`,
        };
    }

    if (quota.minutesUsed + durationMinutes > quota.minutesLimit) {
        const remaining = Math.max(0, quota.minutesLimit - quota.minutesUsed);
        return {
            allowed: false,
            reason: `Not enough quota. ${remaining.toFixed(1)} minutes remaining this month.`,
        };
    }

    return { allowed: true };
}

function getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
}

export async function getUsageStats(sessionId: string): Promise<{
    totalMinutes: number;
    totalCost: number;
    totalRecordings: number;
    modelsUsed: Record<string, number>;
}> {
    const logs = await prisma.usageLog.findMany({
        where: { sessionId },
    });

    const modelsUsed: Record<string, number> = {};
    let totalMinutes = 0;
    let totalCost = 0;

    for (const log of logs) {
        totalMinutes += log.minutes;
        totalCost += log.cost;
        modelsUsed[log.model] = (modelsUsed[log.model] || 0) + 1;
    }

    return {
        totalMinutes,
        totalCost,
        totalRecordings: logs.length,
        modelsUsed,
    };
}
