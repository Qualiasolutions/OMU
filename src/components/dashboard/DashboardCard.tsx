import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import classNames from "classnames";

type DashboardCardProps = {
  item: {
    id: number;
    name: string;
    stat: string;
    icon: React.ComponentType<React.ComponentProps<"svg">>;
    change: string;
    changeType: 'increase' | 'decrease';
  };
};

export default function DashboardCard({ item }: DashboardCardProps) {
  return (
    <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
      <dt>
        <div className="absolute bg-primary-100 rounded-md p-3">
          <item.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
        </div>
        <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
      </dt>
      <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
        <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
        <p
          className={classNames(
            item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
            'ml-2 flex items-baseline text-sm font-semibold'
          )}
        >
          {item.changeType === 'increase' ? (
            <ArrowUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
          ) : (
            <ArrowDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" aria-hidden="true" />
          )}
          <span className="ml-1">{item.change}</span>
        </p>
        <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              View details
            </a>
          </div>
        </div>
      </dd>
    </div>
  );
} 