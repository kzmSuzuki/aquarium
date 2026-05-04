import { NextResponse } from 'next/server';
import { deleteFishData } from '@/lib/google';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await deleteFishData(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete fish data:`, error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
