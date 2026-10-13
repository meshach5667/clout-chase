import { useState } from "react";
import { Bell, Flame, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "spotlight" | "settlement" | "challenge" | "social";
};

const NOTIFICATIONS_STORAGE_KEY = "cloutchase.notifications.v1";

export function NotificationsMenu({ className }: { className?: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return (parsed as AppNotification[]).filter(
        (notification) => !["notif-1", "notif-2", "notif-3"].includes(notification.id),
      );
    } catch {
      return [];
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "spotlight":
        return <Sparkles className="size-4 text-primary shrink-0" />;
      case "settlement":
        return <Flame className="size-4 text-emerald-500 shrink-0" />;
      case "challenge":
        return <Trophy className="size-4 text-amber-500 shrink-0" />;
      default:
        return <Bell className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
          aria-label="Activity notifications"
          title="Notifications & Activity"
        >
          <Bell className="size-4 text-foreground transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-1.5rem)] max-w-96 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border/70 p-3.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">Activity</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recent notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3.5 transition-colors ${
                  notif.read ? "bg-surface opacity-80" : "bg-primary/5"
                }`}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
