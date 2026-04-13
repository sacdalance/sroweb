import supabase from "@/lib/supabase";

/**
 * Creates a notification for a user.
 * Fire-and-forget — never throws to avoid breaking the primary action.
 */
export async function createNotification({
  recipientId,
  type,
  title,
  message,
  referenceType = null,
  referenceId = null,
}) {
  try {
    const { error } = await supabase.from("notifications").insert({
      recipient_id: recipientId,
      type,
      title,
      message,
      reference_type: referenceType,
      reference_id: referenceId,
    });
    if (error) console.error("Failed to create notification:", error);
  } catch (err) {
    console.error("Notification insert error:", err);
  }
}

/**
 * Fetch unread notification count for current user.
 */
export async function fetchUnreadCount(accountId) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", accountId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
  return count || 0;
}

/**
 * Fetch recent notifications for current user.
 */
export async function fetchNotifications(accountId, limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", accountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data || [];
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) console.error("Error marking notification as read:", error);
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(accountId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", accountId)
    .eq("is_read", false);

  if (error) console.error("Error marking all as read:", error);
}

/**
 * Subscribe to real-time notifications for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(accountId, onNewNotification) {
  const channel = supabase
    .channel(`notifications:${accountId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${accountId}`,
      },
      (payload) => {
        onNewNotification(payload.new);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}
