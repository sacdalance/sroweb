import supabase from "@/lib/supabase";

/**
 * Approves an activity based on role
 */
export async function approveActivity(activityId, comment, userRole) {
  const updates = {};

  // Fetch current activity to check final_status
  const { data: activity } = await supabase
    .from('activity')
    .select('final_status')
    .eq('activity_id', activityId)
    .single();

  if (userRole === 2) {
    updates.sro_approval_status = "Approved";
    updates.sro_remarks = comment;
    // If currently For Appeal, set final_status to null
    if (activity?.final_status === "For Appeal") {
      updates.final_status = null;
    }
  } else if (userRole === 3) {
    updates.odsa_approval_status = "Approved";
    updates.odsa_remarks = comment;
    updates.final_status = "Approved";
  } else if (userRole === 4) {
    // comment should be an object: { sro: string, odsa: string }
    updates.sro_approval_status = "Approved";
    updates.sro_remarks = comment.sro;
    updates.odsa_approval_status = "Approved";
    updates.odsa_remarks = comment.odsa;
    updates.final_status = "Approved";
  } else {
    throw new Error("Invalid user role");
  }

  const { error } = await supabase
    .from("activity")
    .update(updates)
    .eq("activity_id", activityId);

  if (error) {
    console.error("Supabase error during approval:", error);
    throw new Error("Failed to approve activity.");
  }
}

/**
 * Rejects an activity based on role
 */
export async function rejectActivity(activityId, comment, userRole) {
  const updates = {};

  if (userRole === 2) {
    updates.sro_approval_status = "Rejected";
    updates.sro_remarks = comment;
    updates.odsa_approval_status = "Rejected"; // Skip ODSA
    updates.final_status = "Rejected";
  } else if (userRole === 3) {
    updates.odsa_approval_status = "Rejected";
    updates.odsa_remarks = comment;
    updates.final_status = "Rejected";
  } else if (userRole === 4) {
    // comment should be an object: { sro: string, odsa: string }
    updates.sro_approval_status = "Rejected";
    updates.sro_remarks = comment.sro;
    updates.odsa_approval_status = "Rejected";
    updates.odsa_remarks = comment.odsa;
    updates.final_status = "Rejected";
  } else {
    throw new Error("Invalid user role");
  }

  const { error } = await supabase
    .from("activity")
    .update(updates)
    .eq("activity_id", activityId);

  if (error) {
    console.error("Supabase error during rejection:", error);
    throw error;
  }
}
