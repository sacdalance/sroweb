import supabase from "@/lib/supabase";

/**
 * Approves an activity based on role
 */
export async function approveActivity(activityId, comment, userRole) {
  const updates = {};

  if (userRole === 2) {
    updates.sro_approval_status = "Approved";
    updates.sro_remarks = comment;
  } else if (userRole === 3) {
    updates.odsa_approval_status = "Approved";
    updates.odsa_remarks = comment;
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
