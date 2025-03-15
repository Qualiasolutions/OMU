import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateImage } from '@/lib/openai';

const imageGenerationSchema = z.object({
  prompt: z.string().min(3).max(1000),
});

export async function POST(req: Request) {
  try {
    // Check for OpenAI API key in environment
    const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
    
    if (!hasApiKey) {
      return NextResponse.json(
        { 
          error: 'OpenAI API configuration error',
          message: 'The OpenAI API key is missing or invalid. Cannot generate images without an API key.',
        },
        { status: 500 }
      );
    }
    
    const body = await req.json();
    const validatedData = imageGenerationSchema.parse(body);

    const generatedImage = await generateImage(validatedData.prompt);

    return NextResponse.json(generatedImage);
  } catch (error) {
    console.error('Image generation error:', error);
    
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
          message: 'The OpenAI API key is missing or invalid. Cannot generate images.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
} 