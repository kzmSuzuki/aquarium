import { NextResponse } from 'next/server';
import { getRandomFishData } from '@/lib/google';

// 通信負荷対策（サーバーキャッシュ）：同じeventIdのリクエストに対し、60秒間は前回の結果を使い回す
export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const countParam = searchParams.get('count');
    const count = countParam ? parseInt(countParam, 10) : 15;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const data = await getRandomFishData(eventId, count);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get random fish data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
