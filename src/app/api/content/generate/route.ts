import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSocialMediaContent, SocialPlatform } from '@/lib/openai';

const contentGenerationSchema = z.object({
  topic: z.string().min(3).max(200),
  tone: z.enum(['professional', 'casual', 'humorous', 'inspirational']).optional(),
  targetAudience: z.string().optional(),
  includeHashtags: z.boolean().optional(),
  platform: z.enum(['instagram', 'twitter', 'facebook', 'linkedin']),
  additionalContext: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = contentGenerationSchema.parse(body);

    const generatedContent = await generateSocialMediaContent({
      topic: validatedData.topic,
      tone: validatedData.tone,
      targetAudience: validatedData.targetAudience,
      includeHashtags: validatedData.includeHashtags,
      platform: validatedData.platform as SocialPlatform,
      additionalContext: validatedData.additionalContext,
    });

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error('Content generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
} 