import React from 'react';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { X } from 'lucide-react';

export interface LinkedItem {
  id: string;
  name: string;
}

interface WithEntityLinkingProps {
  onLink?: (itemId: string) => void;
  onUnlink?: (itemId: string) => void;
  linkedItems?: LinkedItem[];
  loading?: boolean;
}

export function withEntityLinking<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithEntityLinkingComponent({
    onLink,
    onUnlink,
    linkedItems = [],
    loading = false,
    ...props
  }: P & WithEntityLinkingProps) {
    return (
      <div className="space-y-4">
        <WrappedComponent {...props as P} onChange={onLink} />
        
        {linkedItems.length > 0 && (
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="space-y-2">
              {linkedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUnlink?.(item.id)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };
}
