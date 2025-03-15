'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface GeneratedContent {
  mainContent: string;
  hashtags: string[];
  suggestedImagePrompt?: string;
  _warning?: string;
}

interface GeneratedImage {
  imageUrl: string;
  prompt: string;
}

export default function CreatePost() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'humorous' | 'inspirational'>('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [platform, setPlatform] = useState<'instagram' | 'twitter' | 'facebook' | 'linkedin'>('instagram');
  const [autoSubmit, setAutoSubmit] = useState(true);
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [postContent, setPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'review'>('generate');

  const [apiWarning, setApiWarning] = useState<string | null>(null);
  
  // Image generation states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [customImagePrompt, setCustomImagePrompt] = useState('');

  const createPost = async (content: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          scheduledFor: scheduledFor || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data._mockData) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Successfully created post
      // Check if it's a mock post due to database issues
      if (data._mockData) {
        alert('Post created in mock mode due to database connection issues. Your content has been generated but may not be saved permanently.');
      } else {
        alert('Post created successfully!');
      }
      
      setTimeout(() => {
        router.push('/dashboard/posts');
      }, 1000);
      
      return true;
    } catch (err) {
      // Handle specific database connection errors
      if (err instanceof Error && 
          (err.message.includes('database') || 
           err.message.includes('connection') || 
           err.message.includes('ECONNREFUSED'))) {
        setError('Database connection error. Your post is generated but couldn\'t be saved.');
        alert('Warning: Database connection issues detected. Your content was generated but may not be saved.');
        return true; // Return true to continue with the flow even with DB errors
      }
      
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setApiWarning(null);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          tone,
          targetAudience: targetAudience || undefined,
          includeHashtags,
          platform,
          additionalContext: additionalContext || undefined,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to generate content');
      }

      // Check for API warning
      if (data._warning) {
        setApiWarning(data._warning);
      }
      
      setGeneratedContent(data);
      
      // Format content with hashtags for posting
      const formattedContent = data.mainContent + 
        (data.hashtags.length > 0 ? 
          '\n\n' + data.hashtags.map((tag: string) => `#${tag}`).join(' ') : 
          '');
      
      setPostContent(formattedContent);
      
      // If auto-submit is enabled, create the post automatically
      if (autoSubmit) {
        const success = await createPost(formattedContent);
        if (success) return;
      }
      
      setActiveTab('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to generate image using the suggested prompt or custom prompt
  const generateImageFromPrompt = async (prompt: string = '') => {
    if (!prompt && !generatedContent?.suggestedImagePrompt && !customImagePrompt) {
      setImageError('Please provide an image prompt or generate content first');
      return;
    }
    
    // Use custom prompt, or fallback to suggested prompt from content generation
    const finalPrompt = prompt || customImagePrompt || generatedContent?.suggestedImagePrompt || '';
    
    setIsGeneratingImage(true);
    setImageError(null);
    
    try {
      const response = await fetch('/api/content/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      setGeneratedImage(data);
      setMediaUrl(data.imageUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPost(postContent);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-1">Generate AI-powered content for your social media posts</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('generate')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              1. Generate Content
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'review'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!generatedContent}
            >
              2. Review & Post
            </button>
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md border border-red-100">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {activeTab === 'generate' ? (
        <form onSubmit={generateContent} className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Topic or Subject *
            </label>
            <input
              id="topic"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's your post about? (e.g. 'Our new summer collection')"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
                Platform *
              </label>
              <select
                id="platform"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                required
              >
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                id="tone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
                <option value="inspirational">Inspirational</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              id="targetAudience"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Who is this content for? (e.g. 'Young professionals age 25-35')"
            />
          </div>

          <div>
            <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context
            </label>
            <textarea
              id="additionalContext"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Add any additional details that might help generate better content"
            />
          </div>

          <div className="flex items-center">
            <input
              id="includeHashtags"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
            />
            <label htmlFor="includeHashtags" className="ml-2 block text-sm text-gray-700">
              Include relevant hashtags
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="autoSubmit"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={autoSubmit}
              onChange={(e) => setAutoSubmit(e.target.checked)}
            />
            <label htmlFor="autoSubmit" className="ml-2 block text-sm text-gray-700">
              Automatically create post after generation
            </label>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !topic}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isGenerating || !topic ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Content'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {generatedContent && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 mb-2">AI Generated Suggestion</h3>
              {generatedContent.suggestedImagePrompt && (
                <div className="text-xs text-indigo-600 mb-2">
                  <p className="font-medium mb-1">Image suggestion:</p>
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={customImagePrompt || generatedContent.suggestedImagePrompt}
                        onChange={(e) => setCustomImagePrompt(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-md"
                        placeholder="Customize the image prompt"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => generateImageFromPrompt()}
                      disabled={isGeneratingImage}
                      className={`px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                        isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                    </button>
                  </div>
                </div>
              )}
              {apiWarning && (
                <p className="text-xs text-orange-600 mt-2">
                  <span className="font-medium">Note:</span> Using template-based generation. For more personalized content, please configure an OpenAI API key.
                </p>
              )}
            </div>
          )}
          
          {imageError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              <p>{imageError}</p>
            </div>
          )}
          
          {generatedImage && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Generated Image</h3>
              <div className="relative w-full h-48 md:h-64 bg-gray-100 rounded-md overflow-hidden">
                <Image
                  src={generatedImage.imageUrl}
                  alt="Generated image"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Prompt: {generatedImage.prompt}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 mb-2">
              Post Content *
            </label>
            <textarea
              id="postContent"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Media URL
            </label>
            <input
              type="text"
              id="mediaUrl"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Enter image or video URL"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Post (Optional)
            </label>
            <input
              type="datetime-local"
              id="scheduledFor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Edit
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !postContent}
              className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting || !postContent ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      )}
        </div>
      </div>
    </div>
  );
} 