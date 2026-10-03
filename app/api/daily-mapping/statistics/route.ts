
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/daily-mapping/statistics - Get statistics
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all entries in period
    const entries = await prisma.dailyEntry.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
        },
      },
      include: {
        emotions: true,
        intentionFulfillments: true,
      },
      orderBy: { date: 'asc' },
    });

    // Calculate consecutive streak
    const sortedDates = entries
      .map(e => new Date(e.date).toDateString())
      .sort();
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = sortedDates.length > 0 ? 1 : 0;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // Check if last entry was today or yesterday
    if (sortedDates.length > 0) {
      const lastEntry = new Date(sortedDates[sortedDates.length - 1]);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreak = tempStreak;
      }
    }

    // Energy and emotional averages
    const avgEnergy = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.energyLevel, 0) / entries.length
      : 0;
    
    const avgEmotional = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.emotionalState, 0) / entries.length
      : 0;

    // Count emotions
    const emotionCounts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.emotions.forEach(emotion => {
        emotionCounts[emotion.emotionType] = (emotionCounts[emotion.emotionType] || 0) + 1;
      });
    });

    const topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    // Count synchronicities
    const synchronicityCount = entries.filter(e => 
      e.synchronicities && e.synchronicities.trim().length > 0
    ).length;

    // Intention fulfillment
    const totalIntentionChecks = entries.reduce(
      (sum, e) => sum + e.intentionFulfillments.length,
      0
    );
    const fulfilledIntentionChecks = entries.reduce(
      (sum, e) => sum + e.intentionFulfillments.filter(f => f.fulfilled).length,
      0
    );
    const fulfillmentRate = totalIntentionChecks > 0
      ? (fulfilledIntentionChecks / totalIntentionChecks) * 100
      : 0;

    // Energy trend by day of week
    const dayOfWeekEnergy: Record<string, { sum: number; count: number }> = {};
    entries.forEach(entry => {
      const dayName = new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'long' });
      if (!dayOfWeekEnergy[dayName]) {
        dayOfWeekEnergy[dayName] = { sum: 0, count: 0 };
      }
      dayOfWeekEnergy[dayName].sum += entry.energyLevel;
      dayOfWeekEnergy[dayName].count += 1;
    });

    const energyByDay = Object.entries(dayOfWeekEnergy).map(([day, data]) => ({
      day,
      avgEnergy: data.sum / data.count,
    }));

    // Weekly energy trend
    const weeklyData: Record<string, { energySum: number; emotionalSum: number; count: number }> = {};
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { energySum: 0, emotionalSum: 0, count: 0 };
      }
      weeklyData[weekKey].energySum += entry.energyLevel;
      weeklyData[weekKey].emotionalSum += entry.emotionalState;
      weeklyData[weekKey].count += 1;
    });

    const weeklyTrends = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      avgEnergy: data.energySum / data.count,
      avgEmotional: data.emotionalSum / data.count,
    }));

    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      overall: {
        totalEntries: entries.length,
        currentStreak,
        longestStreak: maxStreak,
        avgEnergy: parseFloat(avgEnergy.toFixed(2)),
        avgEmotional: parseFloat(avgEmotional.toFixed(2)),
        synchronicityCount,
        fulfillmentRate: parseFloat(fulfillmentRate.toFixed(1)),
      },
      emotions: {
        topEmotions,
        totalEmotionRecords: entries.reduce((sum, e) => sum + e.emotions.length, 0),
      },
      trends: {
        energyByDayOfWeek: energyByDay,
        weeklyTrends,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
