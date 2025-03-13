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

    // If we have scheduledFor but no socialAccountId, we can't create a scheduled post
    if (validatedData.scheduledFor && !validatedData.socialAccountId) {
      return NextResponse.json(
        { error: 'Social account is required for scheduled posts' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content: validatedData.content,
        mediaUrls: validatedData.mediaUrls || [],
        status: 'DRAFT',
        user: {
          connect: { id: user.id }
        },
        ...(validatedData.socialAccountId && {
          socialAccount: {
            connect: { id: validatedData.socialAccountId }
          }
        }),
        ...(validatedData.scheduledFor && validatedData.socialAccountId ? {
          scheduledPost: {
            create: {
              scheduledFor: new Date(validatedData.scheduledFor),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              status: 'PENDING',
              content: validatedData.content,
              mediaUrls: validatedData.mediaUrls || [],
              user: {
                connect: { id: user.id }
              },
              socialAccount: {
                connect: { id: validatedData.socialAccountId }
              }
            }
          }
        } : {})
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