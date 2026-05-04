import { NextResponse } from 'next/server';
import { deleteEventData } from '@/lib/google';

export async function DELETE(request: Request, context: { params: { eventId: string } }) {
  try {
    const eventId = context.params.eventId;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    await deleteEventData(eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete event data (eventId: ${context.params.eventId}):`, error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
