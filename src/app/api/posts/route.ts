import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Valid post status values from the schema
const POST_STATUS_VALUES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'] as const;
type PostStatus = typeof POST_STATUS_VALUES[number];

const postSchema = z.object({
  content: z.string().min(1),
  mediaUrls: z.array(z.string().url()).optional(),
  socialAccountId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

const updatePostSchema = z.object({
  id: z.string(),
  content: z.string().min(1).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  status: z.enum(POST_STATUS_VALUES).optional(),
});

// Get all posts for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the base where clause
    const where: any = { userId: user.id };
    
    // Only add status filter if it's a valid enum value
    if (statusParam) {
      const upperStatus = statusParam.toUpperCase();
      if (POST_STATUS_VALUES.includes(upperStatus as PostStatus)) {
        where.status = upperStatus;
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          socialAccount: true,
          scheduledPost: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where })
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new post
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

    // Create the post with proper types
    const createData = {
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
      })
    };

    // Add scheduled post if needed
    if (validatedData.scheduledFor && validatedData.socialAccountId) {
      const post = await prisma.post.create({
        data: {
          ...createData,
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
        },
        include: {
          socialAccount: true,
          scheduledPost: true,
        }
      });
      return NextResponse.json(post);
    } else {
      // Create without scheduled post
      const post = await prisma.post.create({
        data: createData,
        include: {
          socialAccount: true,
          scheduledPost: true,
        }
      });
      return NextResponse.json(post);
    }
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

// Update a post
export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = updatePostSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify post ownership
    const existingPost = await prisma.post.findFirst({
      where: {
        id: validatedData.id,
        userId: user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
      );
    }

    const post = await prisma.post.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.content && { content: validatedData.content }),
        ...(validatedData.mediaUrls && { mediaUrls: validatedData.mediaUrls }),
        ...(validatedData.status && { status: validatedData.status }),
      },
      include: {
        socialAccount: true,
        scheduledPost: true,
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Update post error:', error);
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

// Delete a post
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify post ownership
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 