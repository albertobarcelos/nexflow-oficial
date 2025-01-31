import { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FeedItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  iconColor?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface FeedProps {
  items: FeedItem[];
}

export function Feed({ items = [] }: FeedProps) {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {items.map((item, itemIdx) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {itemIdx !== items.length - 1 ? (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  {/* Icon */}
                  <div className="relative">
                    {Icon ? (
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 ring-8 ring-white",
                          item.iconColor
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    ) : item.user?.avatar ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.user.avatar} />
                        <AvatarFallback>
                          {item.user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {item.user?.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {item.timestamp}
                      </p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{item.title}</p>
                      {item.description && (
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {item.description}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
