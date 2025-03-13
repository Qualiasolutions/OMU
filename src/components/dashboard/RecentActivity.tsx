import { format } from "date-fns";
import { 
  DocumentTextIcon, 
  PhotoIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import classNames from "classnames";

// Mock activity data - would come from API in production
const activity = [
  {
    id: 1,
    type: 'post',
    title: 'New blog post published',
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'completed',
    icon: DocumentTextIcon,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    id: 2,
    type: 'media',
    title: '5 new photos uploaded',
    date: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    status: 'completed',
    icon: PhotoIcon,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    id: 3,
    type: 'follower',
    title: 'Gained 12 new followers',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    status: 'completed',
    icon: UserGroupIcon,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  {
    id: 4,
    type: 'post',
    title: 'Post scheduled for tomorrow',
    date: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    status: 'scheduled',
    icon: ClockIcon,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
  },
];

export default function RecentActivity() {
  return (
    <div className="flow-root mt-6 bg-white shadow rounded-lg p-6">
      <ul className="-mb-8">
        {activity.map((activityItem, activityItemIdx) => (
          <li key={activityItem.id}>
            <div className="relative pb-8">
              {activityItemIdx !== activity.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={classNames(
                      activityItem.bgColor,
                      'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white'
                    )}
                  >
                    <activityItem.icon className={classNames(activityItem.iconColor, 'h-5 w-5')} aria-hidden="true" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-900">{activityItem.title}</p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time dateTime={activityItem.date.toISOString()}>
                      {format(activityItem.date, 'MMM d, h:mm a')}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-center">
        <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all activity
        </a>
      </div>
    </div>
  );
} 