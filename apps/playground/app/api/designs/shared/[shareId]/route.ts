import { NextRequest, NextResponse } from 'next/server';
import { serverStorage } from '@/lib/serverStorage';

/**
 * GET /api/designs/shared/:shareId - Get a shared design
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const design = await serverStorage.getSharedDesign(shareId);

    if (!design) {
      return NextResponse.json(
        { error: 'Shared design not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error fetching shared design:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared design' },
      { status: 500 }
    );
  }
}
