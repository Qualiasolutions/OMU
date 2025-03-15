import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, PrismaClient } from '@prisma/client';

// Valid post status values from the schema
const POST_STATUS_VALUES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'] as const;
type PostStatus = typeof POST_STATUS_VALUES[number];

// Valid schedule status values from the schema
const SCHEDULE_STATUS_VALUES = ['PENDING', 'POSTED', 'FAILED', 'CANCELLED'] as const;
type ScheduleStatus = typeof SCHEDULE_STATUS_VALUES[number];

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
    const body = await req.json();
    const validatedData = postSchema.parse(body);

    // For demo purposes - create a test user if session doesn't exist
    let userId = 'demo-user-id';
    let user = null;
    
    const session = await getServerSession();
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      
      if (user) {
        userId = user.id;
      }
    } else {
      // Try to find or create a demo user
      user = await prisma.user.findFirst({
        where: { email: 'demo@example.com' },
      });
      
      if (!user) {
        try {
          user = await prisma.user.create({
            data: {
              email: 'demo@example.com',
              name: 'Demo User',
            },
          });
          userId = user.id;
        } catch (err) {
          console.error('Error creating demo user:', err);
          // If we can't create a user, we'll use the demo-user-id placeholder
        }
      } else {
        userId = user.id;
      }
    }

    // If we have scheduledFor but no socialAccountId, we can't create a scheduled post
    if (validatedData.scheduledFor && !validatedData.socialAccountId) {
      return NextResponse.json(
        { error: 'Social account is required for scheduled posts' },
        { status: 400 }
      );
    }

    // Create the post data
    const postData = {
      content: validatedData.content,
      mediaUrls: validatedData.mediaUrls || [],
      status: 'DRAFT' as PostStatus,
      user: {
        connect: { id: userId }
      },
      ...(validatedData.socialAccountId && {
        socialAccount: {
          connect: { id: validatedData.socialAccountId }
        }
      })
    };

    // Create without scheduled post for demo purposes
    const post = await prisma.post.create({
      data: postData,
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
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
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