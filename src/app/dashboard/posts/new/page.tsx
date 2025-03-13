"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeftIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

// Form schema
const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  scheduledDate: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const platforms = [
  { id: "twitter", name: "Twitter" },
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "linkedin", name: "LinkedIn" },
];

export default function NewPost() {
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      platforms: [],
      scheduledDate: "",
    },
  });

  const watchedPlatforms = watch("platforms");

  const onSubmit = async (data: PostFormData) => {
    try {
      // This would be an API call in a real application
      console.log("Form data:", data);
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Redirect to posts list after successful submission
      window.location.href = "/dashboard/posts";
    } catch (error) {
      console.error("Error submitting post:", error);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) return;
    
    setIsGenerating(true);
    
    try {
      // This would be a real API call to Mistral AI in production
      // For now, we'll simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const simulatedResponse = {
        title: `${aiPrompt} - new campaign`,
        content: `Check out our amazing ${aiPrompt} that just launched! We're excited to share this with our audience. Let us know what you think in the comments below.`,
      };
      
      setValue("title", simulatedResponse.title);
      setValue("content", simulatedResponse.content);
    } catch (error) {
      console.error("Error generating AI content:", error);
    } finally {
      setIsGenerating(false);
      setIsUsingAI(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/posts" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Post</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Create and schedule content for your social media platforms
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        {isUsingAI ? (
          <div className="bg-white shadow sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Generate with Mistral AI
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Describe what you want to post about and our AI will generate content for you.
                </p>
              </div>
              <div className="mt-5">
                <textarea
                  rows={3}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="e.g. A promotional post for our summer sale on beach accessories"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>
              <div className="mt-5 flex space-x-3">
                <button
                  type="button"
                  disabled={isGenerating || !aiPrompt}
                  onClick={handleAIGenerate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsUsingAI(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsUsingAI(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <SparklesIcon className="-ml-1 mr-2 h-5 w-5 text-primary-500" aria-hidden="true" />
              Generate with AI
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="title"
                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.title ? "border-red-300" : ""
                }`}
                {...register("title")}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="mt-1">
              <textarea
                id="content"
                rows={6}
                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.content ? "border-red-300" : ""
                }`}
                {...register("content")}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Write the content of your social media post
            </p>
          </div>

          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">
                Select platforms
              </legend>
              <div className="mt-2 space-y-3">
                {platforms.map((platform) => (
                  <div key={platform.id} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={platform.id}
                        type="checkbox"
                        value={platform.id}
                        {...register("platforms")}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={platform.id} className="font-medium text-gray-700">
                        {platform.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {errors.platforms && (
                <p className="mt-1 text-sm text-red-600">{errors.platforms.message}</p>
              )}
            </fieldset>
          </div>

          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
              Schedule for later (optional)
            </label>
            <div className="mt-1">
              <input
                type="datetime-local"
                id="scheduledDate"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                {...register("scheduledDate")}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Leave empty to post immediately
            </p>
          </div>

          <div className="pt-5 flex justify-end space-x-3">
            <Link
              href="/dashboard/posts"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 