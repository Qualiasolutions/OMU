import { 
  UserGroupIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  ChartBarIcon 
} from "@heroicons/react/24/outline";
import DashboardCard from "@/components/dashboard/DashboardCard";
import RecentActivity from "@/components/dashboard/RecentActivity";

// Mock stats data - would come from API in production
const stats = [
  { id: 1, name: "Total Posts", stat: "127", icon: DocumentTextIcon, change: "12%", changeType: "increase" as const },
  { id: 2, name: "Media Files", stat: "356", icon: PhotoIcon, change: "2.5%", changeType: "increase" as const },
  { id: 3, name: "Audience", stat: "2,340", icon: UserGroupIcon, change: "4.1%", changeType: "increase" as const },
  { id: 4, name: "Engagement", stat: "24.57%", icon: ChartBarIcon, change: "3.2%", changeType: "decrease" as const },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your social media performance
        </p>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <DashboardCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <RecentActivity />
      </div>
    </div>
  );
} 