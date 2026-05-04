import { NextResponse } from 'next/server';
import { deleteFishData } from '@/lib/google';

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const id = context.params.id;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await deleteFishData(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete fish data (id: ${context.params.id}):`, error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
