import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, Clock, FileText, CalendarCheck, Award, BookOpen, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
} from "@/lib/notifications";
import { toast } from "sonner";

const typeIcons = {
  activity_approved: CheckCheck,
  activity_rejected: FileText,
  activity_sro_approved: Check,
  activity_auto_rejected: FileText,
  appointment_confirmed: CalendarCheck,
  appointment_rescheduled: CalendarCheck,
  appointment_cancelled: CalendarCheck,
  appointment_completed: CalendarCheck,
  org_approved: Award,
  org_sro_approved: Award,
  org_odsa_approved: Award,
  org_rejected: Award,
  recognition_approved: Award,
  recognition_updated: Award,
  annual_report_received: BookOpen,
  system: Info,
};

const typeColors = {
  activity_approved: "text-sro-secondary",
  activity_rejected: "text-sro-primary",
  activity_sro_approved: "text-sro-accent-500",
  activity_auto_rejected: "text-red-500",
  appointment_confirmed: "text-blue-500",
  appointment_rescheduled: "text-orange-500",
  appointment_cancelled: "text-red-500",
  appointment_completed: "text-sro-secondary",
  org_approved: "text-sro-secondary",
  org_sro_approved: "text-sro-accent-500",
  org_odsa_approved: "text-blue-500",
  org_rejected: "text-sro-primary",
  recognition_approved: "text-sro-secondary",
  recognition_updated: "text-sro-accent-500",
  annual_report_received: "text-blue-500",
  system: "text-gray-500",
};

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const NotificationsDropdown = ({ accountId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!accountId) return;
    const [notifs, count] = await Promise.all([
      fetchNotifications(accountId),
      fetchUnreadCount(accountId),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  }, [accountId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!accountId) return;

    const unsubscribe = subscribeToNotifications(accountId, (newNotif) => {
      setNotifications((prev) => {
        // Deduplicate: skip if already present from a concurrent fetch
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev].slice(0, 20);
      });
      setUnreadCount((prev) => prev + 1);
      toast(newNotif.title, {
        description: newNotif.message,
        duration: 5000,
      });
    });

    return unsubscribe;
  }, [accountId]);

  const handleMarkAsRead = async (notif) => {
    if (notif.is_read) return;
    await markAsRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(accountId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-sro-accent text-black rounded-full px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-sro-primary hover:text-sro-primary-800 h-7"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const IconComp = typeIcons[notif.type] || Info;
                const iconColor = typeColors[notif.type] || "text-gray-500";

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif)}
                    className={cn(
                      "flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50",
                      !notif.is_read && "bg-sro-primary-50/50"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg bg-gray-50 shrink-0 h-fit", !notif.is_read && "bg-white")}>
                      <IconComp className={cn("w-4 h-4", iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm text-gray-900 line-clamp-1", !notif.is_read && "font-semibold")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span className="text-[11px] text-gray-400">
                          {timeAgo(notif.created_at)}
                        </span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 bg-sro-primary rounded-full ml-auto" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
