import OpenAI from 'openai';

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_API_KEY || '';
const isApiKeyAvailable = Boolean(apiKey);

// Create OpenAI instance with proper error handling
let openai: OpenAI | null = null;
try {
  if (isApiKeyAvailable) {
    openai = new OpenAI({
      apiKey,
    });
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

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

export interface GeneratedImage {
  imageUrl: string;
  prompt: string;
}

// Function to generate images using DALL-E
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  try {
    // Check if OpenAI client is available
    if (!openai || !isApiKeyAvailable) {
      throw new Error('OpenAI API key is missing');
    }
    
    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });
    
    const imageUrl = response.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }
    
    return {
      imageUrl,
      prompt,
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

// Fallback function to use when OpenAI isn't available
function generateFallbackContent(params: ContentGenerationParams): GeneratedContent {
  const { topic, platform, tone = 'professional' } = params;
  
  // Platform-specific templates
  const templates = {
    instagram: {
      professional: `Check out our latest updates on ${topic}! We're committed to bringing you the best experience.\n\nStay tuned for more updates.`,
      casual: `Hey there! 👋 Just wanted to share some cool stuff about ${topic}! What do you think?`,
      humorous: `We promise ${topic} isn't as boring as your ex's Instagram stories! 😂 Check it out!`,
      inspirational: `Every journey begins with a single step. Our journey with ${topic} is just beginning. Join us on this amazing path!`
    },
    twitter: {
      professional: `Exciting developments with ${topic}. Stay updated with our latest announcements!`,
      casual: `Just vibing with ${topic} today! What's everyone up to?`,
      humorous: `${topic} - because we needed one more thing to talk about on Twitter! 😄`,
      inspirational: `Dream big. Start small. Act now. ${topic} is changing the game!`
    },
    facebook: {
      professional: `Announcing our latest updates regarding ${topic}. Click to learn more about how this affects our community.`,
      casual: `Hey friends! Anyone else excited about ${topic}? Share your thoughts below!`,
      humorous: `If ${topic} was a person, they'd definitely be the one bringing snacks to the party. Just saying!`,
      inspirational: `The future belongs to those who believe in the beauty of their dreams. ${topic} is our dream, and we're making it reality.`
    },
    linkedin: {
      professional: `We're pleased to announce our latest developments regarding ${topic}. This represents a significant step forward for our organization.`,
      casual: `Interesting developments with ${topic} this week. Would love to hear thoughts from my network on this!`,
      humorous: `They say success is 1% inspiration and 99% perspiration. ${topic} is that 1% that made all the difference!`,
      inspirational: `The difference between ordinary and extraordinary is that little extra. ${topic} is our extra. What's yours?`
    }
  };
  
  // Default hashtags for each platform
  const defaultHashtags = {
    instagram: ['instagood', 'photooftheday', topic.replace(/\s+/g, ''), 'trending'],
    twitter: ['trending', topic.replace(/\s+/g, '')],
    facebook: [topic.replace(/\s+/g, ''), 'community'],
    linkedin: ['innovation', 'professional', topic.replace(/\s+/g, '')]
  };
  
  return {
    mainContent: templates[platform][tone],
    hashtags: defaultHashtags[platform],
    suggestedImagePrompt: `A professional image representing ${topic} with good lighting and composition`
  };
}

export async function generateSocialMediaContent(
  params: ContentGenerationParams
): Promise<GeneratedContent> {
  try {
    // Check if OpenAI client is available
    if (!openai || !isApiKeyAvailable) {
      console.warn('OpenAI API key is missing. Using fallback content generation.');
      return generateFallbackContent(params);
    }
    
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
    // Fallback to template-based generation on any error
    return generateFallbackContent(params);
  }
} 