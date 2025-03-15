import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type SocialPlatform = 'instagram' | 'twitter' | 'facebook' | 'linkedin';

export interface ContentGenerationParams {
  topic: string;
  tone?: 'professional' | 'casual' | 'humorous' | 'inspirational';
  targetAudience?: string;
  includeHashtags?: boolean;
  platform: SocialPlatform;
  additionalContext?: string;
}

export interface GeneratedContent {
  mainContent: string;
  hashtags: string[];
  suggestedImagePrompt?: string;
}

export async function generateSocialMediaContent(
  params: ContentGenerationParams
): Promise<GeneratedContent> {
  try {
    const { topic, tone = 'professional', targetAudience, includeHashtags = true, platform, additionalContext } = params;
    
    // Platform-specific instructions
    const platformInstructions = {
      instagram: "Create an engaging Instagram caption with proper spacing, emojis, and a conversational tone. Keep it under 2,200 characters.",
      twitter: "Create a concise Twitter post under 280 characters with impactful language.",
      facebook: "Create a Facebook post with a headline and details. Include questions to encourage engagement.",
      linkedin: "Create a professional LinkedIn post with industry insights and a call to action. Use paragraph breaks for readability."
    };
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert social media content creator specializing in creating high-quality, engaging posts for ${platform}. 
          ${platformInstructions[platform]}
          Write content that resonates with the target audience and drives engagement.`
        },
        {
          role: "user",
          content: `Create a ${tone} ${platform} post about "${topic}"${targetAudience ? ` for ${targetAudience}` : ''}.
          ${additionalContext ? `Additional context: ${additionalContext}` : ''}
          ${includeHashtags ? 'Include relevant hashtags separated at the end.' : ''}
          
          Return the response in JSON format with these fields:
          - mainContent: The main post content
          - hashtags: An array of relevant hashtags (without the # symbol)
          - suggestedImagePrompt: A prompt that could be used to generate an accompanying image`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error("Failed to generate content");
    }
    
    const parsedResponse = JSON.parse(responseContent) as GeneratedContent;
    
    return {
      mainContent: parsedResponse.mainContent,
      hashtags: parsedResponse.hashtags || [],
      suggestedImagePrompt: parsedResponse.suggestedImagePrompt
    };
  } catch (error) {
    console.error("Error generating social media content:", error);
    throw new Error("Failed to generate content. Please try again.");
  }
} 