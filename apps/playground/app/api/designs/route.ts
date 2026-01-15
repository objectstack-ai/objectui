import { NextRequest, NextResponse } from 'next/server';
import type { Design } from '@/lib/designStorage';
import { serverStorage } from '@/lib/serverStorage';

/**
 * GET /api/designs - List all designs
 */
export async function GET() {
  try {
    const allDesigns = await serverStorage.getAllDesigns();
    return NextResponse.json(allDesigns);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/designs - Create new design
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, schema, tags } = body;

    if (!name || !schema) {
      return NextResponse.json(
        { error: 'Name and schema are required' },
        { status: 400 }
      );
    }

    const id = `design_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const newDesign: Design = {
      id,
      name,
      description,
      schema,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    await serverStorage.createDesign(newDesign);

    return NextResponse.json(newDesign, { status: 201 });
  } catch (error) {
    console.error('Error creating design:', error);
    return NextResponse.json(
      { error: 'Failed to create design' },
      { status: 500 }
    );
  }
}
