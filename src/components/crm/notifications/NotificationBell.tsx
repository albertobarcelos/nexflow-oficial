import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

export function NotificationBell() {
  const { data: notifications = [], isLoading } = useNotifications(20);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

  // Se não houver notificações não lidas, mostrar a aba "Lidas" por padrão
  useEffect(() => {
    if (unreadCount === 0 && notifications.length > 0) {
      setActiveTab('read');
    } else if (unreadCount > 0) {
      setActiveTab('unread');
    }
  }, [unreadCount, notifications.length]);

  const { unreadNotifications, readNotifications } = useMemo(() => {
    const unread = notifications.filter((n) => !n.read);
    const read = notifications.filter((n) => n.read);
    return { unreadNotifications: unread, readNotifications: read };
  }, [notifications]);

  const handleNotificationClick = async (notificationId: string) => {
    if (!notifications.find((n) => n.id === notificationId)?.read) {
      await markAsRead.mutateAsync(notificationId);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const renderNotification = (notification: typeof notifications[0]) => (
    <div
      key={notification.id}
      className={cn(
        "p-4 hover:bg-accent cursor-pointer transition-colors",
        !notification.read && "bg-blue-50 "
      )}
      onClick={() => handleNotificationClick(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium",
            !notification.read && "font-semibold"
          )}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
        )}
      </div>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && activeTab === 'unread' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'unread' | 'read')} className="w-full">
          <div className="border-b px-4">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0">
              <TabsTrigger 
                value="unread" 
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  unreadCount > 0 && "relative"
                )}
              >
                Novas
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="read" 
                className="px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Lidas
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <>
                <TabsContent value="unread" forceMount className="m-0 data-[state=inactive]:hidden">
                  {unreadNotifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma notificação nova
                    </div>
                  ) : (
                    <div className="divide-y">
                      {unreadNotifications.map(renderNotification)}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="read" forceMount className="m-0 data-[state=inactive]:hidden">
                  {readNotifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma notificação lida
                    </div>
                  ) : (
                    <div className="divide-y">
                      {readNotifications.map(renderNotification)}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}





