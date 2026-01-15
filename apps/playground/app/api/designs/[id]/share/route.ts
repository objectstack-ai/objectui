import { NextRequest, NextResponse } from 'next/server';
import { serverStorage } from '@/lib/serverStorage';

/**
 * POST /api/designs/:id/share - Generate share link for a design
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const design = await serverStorage.getDesign(id);

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Generate a unique share ID
    const shareId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    
    // Store the shared design
    await serverStorage.shareDesign(id, shareId);

    // Generate the share URL
    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/studio/shared/${shareId}`;

    return NextResponse.json({ shareUrl, shareId });
  } catch (error) {
    console.error('Error sharing design:', error);
    return NextResponse.json(
      { error: 'Failed to share design' },
      { status: 500 }
    );
  }
}
