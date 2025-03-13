import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const postSchema = z.object({
  content: z.string().min(1),
  mediaUrls: z.array(z.string().url()).optional(),
  socialAccountId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = postSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content: validatedData.content,
        mediaUrls: validatedData.mediaUrls || [],
        socialAccountId: validatedData.socialAccountId,
        status: 'DRAFT',
        userId: user.id,
        ...(validatedData.scheduledFor && {
          scheduledPost: {
            create: {
              scheduledFor: new Date(validatedData.scheduledFor),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              userId: user.id,
              socialAccountId: validatedData.socialAccountId!,
              content: validatedData.content,
              mediaUrls: validatedData.mediaUrls || [],
              status: 'PENDING'
            }
          }
        })
      },
      include: {
        socialAccount: true,
        scheduledPost: true,
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 