import Link from "next/link";
import { 
  PlusIcon,
  PencilIcon,
  CalendarIcon,
  TrashIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";

// Mock posts data - would come from API in production
const posts = [
  {
    id: 1,
    title: "Introducing our new product line",
    content: "We're excited to announce our latest product line is now available! Check out our website for more details.",
    platforms: ["twitter", "facebook", "instagram"],
    status: "published",
    publishDate: "Mar 10, 2023",
    engagement: 423,
  },
  {
    id: 2,
    title: "Summer sale starts next week",
    content: "Get ready for our biggest summer sale yet! Starting next Monday, enjoy up to 50% off on selected items.",
    platforms: ["facebook", "instagram"],
    status: "scheduled",
    publishDate: "Mar 15, 2023",
    engagement: null,
  },
  {
    id: 3,
    title: "Customer success story: ABC Corp",
    content: "Read how ABC Corp increased their productivity by 35% using our platform.",
    platforms: ["linkedin", "twitter"],
    status: "draft",
    publishDate: null,
    engagement: null,
  },
  {
    id: 4,
    title: "Team spotlight: Meet our designers",
    content: "In this month's team spotlight, we introduce you to our amazing design team.",
    platforms: ["instagram", "facebook"],
    status: "published",
    publishDate: "Mar 5, 2023",
    engagement: 287,
  },
];

function PlatformBadge({ platform }: { platform: string }) {
  const getColor = (platform: string) => {
    switch(platform) {
      case "twitter": return "bg-blue-100 text-blue-800";
      case "facebook": return "bg-indigo-100 text-indigo-800";
      case "instagram": return "bg-pink-100 text-pink-800";
      case "linkedin": return "bg-sky-100 text-sky-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor(platform)}`}>
      {platform.charAt(0).toUpperCase() + platform.slice(1)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = (status: string) => {
    switch(status) {
      case "published": return "bg-green-100 text-green-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Posts() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Posts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your social media posts across all platforms
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Post
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Platforms
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Engagement
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{post.title}</div>
                        <div className="text-gray-500 truncate max-w-xs">{post.content}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex gap-1 flex-wrap">
                          {post.platforms.map((platform) => (
                            <PlatformBadge key={platform} platform={platform} />
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {post.publishDate || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {post.engagement !== null ? post.engagement : "—"}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                          >
                            <PencilIcon className="h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">Edit post</span>
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                          >
                            <CalendarIcon className="h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">Schedule post</span>
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                          >
                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">Delete post</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 