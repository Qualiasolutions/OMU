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
    // Check for OpenAI API key in environment
    const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
    
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

    // Add a warning if using fallback generation
    if (!hasApiKey) {
      return NextResponse.json({
        ...generatedContent,
        _warning: "Using fallback template generation. For better results, configure an OpenAI API key in environment variables."
      });
    }

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error('Content generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    // Check if error is related to OpenAI API key
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'OpenAI API configuration error',
          message: 'The OpenAI API key is missing or invalid. Using fallback content generation.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
} 