import { NextResponse } from 'next/server';
import { uploadImageToDrive, appendFishData, getFishDataByEvent, FishData } from '@/lib/google';
import crypto from 'crypto';

// GET: 指定されたeventIdの魚データ一覧を取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const data = await getFishDataByEvent(eventId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get fish data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: 新しい魚画像のアップロードとデータ登録
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64Image, templateId, eventId } = body;

    if (!base64Image || !templateId || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const fileName = `fish_${eventId}_${id}.png`;

    // 1. Google Driveに画像をアップロード
    const { fileId, webContentLink } = await uploadImageToDrive(base64Image, fileName, 'image/png');

    // 2. Google Sheetsにメタデータを保存
    const fishData: FishData = {
      id,
      driveFileId: fileId,
      imageUrl: webContentLink,
      templateId,
      createdAt: new Date().toISOString(),
      eventId
    };

    await appendFishData(fishData);

    return NextResponse.json({ success: true, data: fishData });
  } catch (error) {
    console.error('Failed to post fish data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
