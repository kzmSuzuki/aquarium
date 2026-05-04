// Google Apps Script(GAS) への通信インターフェース

export interface FishData {
  id: string;
  driveFileId: string;
  imageUrl: string;
  templateId: string;
  createdAt: string;
  eventId: string;
}

const GAS_URL = process.env.GAS_WEB_APP_URL;

/**
 * GASへPOSTリクエストを送り、結果をパースする汎用関数
 */
async function fetchGAS(payload: any) {
  if (!GAS_URL) {
    throw new Error('GAS_WEB_APP_URL is not configured in environment variables.');
  }

  // Next.jsのfetchでは自動でリダイレクトを追従するため、GASの仕様(302リダイレクト)も正常に処理されます。
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store' // キャッシュを無効化
  });

  const text = await response.text();
  
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("GASからのレスポンスをパースできませんでした。Response:", text);
    throw new Error("Invalid response from GAS");
  }

  if (json.error) {
    throw new Error("GAS Error: " + json.error);
  }

  return json;
}

// Driveへのアップロード (GAS経由)
export async function uploadImageToDrive(base64Image: string, fileName: string, mimeType: string): Promise<{ fileId: string, webContentLink: string }> {
  return await fetchGAS({
    action: "uploadImage",
    base64Image,
    fileName,
    mimeType
  });
}

// Sheetに追記 (GAS経由)
export async function appendFishData(data: FishData) {
  await fetchGAS({
    action: "appendFish",
    data
  });
}

// Sheetから特定イベントの魚を取得 (GAS経由)
export async function getFishDataByEvent(eventId: string): Promise<FishData[]> {
  return await fetchGAS({
    action: "getFishDataByEvent",
    eventId
  });
}

// ランダムに取得
export async function getRandomFishData(eventId: string, count: number): Promise<FishData[]> {
  const data = await getFishDataByEvent(eventId);
  const shuffled = [...data].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 個別データの削除 (GAS経由)
export async function deleteFishData(id: string) {
  await fetchGAS({
    action: "deleteFish",
    id
  });
}

// イベント単位の一括削除 (GAS経由)
export async function deleteEventData(eventId: string) {
  await fetchGAS({
    action: "deleteEvent",
    eventId
  });
}
