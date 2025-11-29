// API Route: Fetch session from Heidi
import { NextRequest, NextResponse } from 'next/server';
import { heidiClient } from '@/lib/heidi-client';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Try to authenticate first
    await heidiClient.authenticate();
    
    // Fetch the session
    const note = await heidiClient.fetchSession(sessionId);

    if (!note) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: note,
      source: 'heidi-api', // or 'mock' if using fallback
    });
  } catch (error: any) {
    console.error('Heidi fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Heidi', details: error.message },
      { status: 500 }
    );
  }
}
