import { supabase } from '../supabaseClient.js';

/**
 * Creates an in-app notification. Fire-and-forget.
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
    const { error } = await supabase.from('notifications').insert({
      recipient_id: recipientId,
      type,
      title,
      message,
      reference_type: referenceType,
      reference_id: referenceId,
    });
    if (error) console.error('Failed to create notification:', error);
  } catch (err) {
    console.error('Notification insert error:', err);
  }
}
