import supabase from "@/lib/supabase";

/**
 * Generates HTML email template for activity approval
 */
const generateApprovalEmailHTML = (activityData) => {
  const { orgName, activityName, venue, displayDate, formCode, sroComments, odsaComments } = activityData;
  
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
  <p>Dear, <strong>${orgName}</strong>!</p>
  <p>We are pleased to inform you that your request to hold "<strong>${activityName}</strong>", in "<strong>${venue}</strong>", on "<strong>${displayDate}</strong>" has been <strong>APPROVED!</strong></p>
  <p>Please ensure that you retrieve your OSA-SRO Form 1B - Student Activity Approval Slip from the outgoing bin at OSA. You will need to submit a copy of this slip to the UPB Security Office, and to some of the Venue Approvers to finalize your venue reservation.</p>
  <p>Take note of your Activity Form Id: <strong>#${formCode}</strong>.</p>
  <p>Please refer to these comments for other reminders and notes by the SRO/OSA:<br>
  SRO Comment: <strong>"${sroComments || 'No additional comments'}"</strong><br>
  ODSA Comment: <strong>"${odsaComments || 'No additional comments'}"</strong></p>
  <p><strong>REMINDER: This is an automated e-mail. Kindly do not reply to this e-mail.</strong><br>
  If you have concerns, please send a separate e-mail with the subject: "<strong>Activity Concern, #${formCode}</strong>".</p>
  <p>Thank you,<br>
  <small><i>Yours in honour, excellence and service,</i></small><br><br>
  <strong>Office of Student Affairs | Student Relations Office<br>
  E-mail: sro.upbaguio@up.edu.ph</strong><br><br>
  <small><i>Please help us improve our services! Fill-out our Customer Feedback Form: UPB CFF. Thank you.</i></small><br><br>
  <small><strong>Confidentiality:</strong> The information contained in this e-mail message is intended only for the personal and confidential use of the designated recipient(s) of the same. If you are not an intended recipient of this message or an agent responsible for delivering it to an intended recipient, you are hereby notified that you have received this message in error, and that any review, dissemination, distribution, or copying of this message, in whole or in part, is strictly prohibited. If you have received this message in error, please delete it and all copies and notify me immediately by reply e-mail (sro.upbaguio@up.edu.ph). Thank you.</small></p>
</div>`;
};

/**
 * Generates HTML email template for activity rejection
 */
const generateRejectionEmailHTML = (activityData) => {
  const { orgName, activityName, venue, displayDate, formCode, sroComments, odsaComments } = activityData;
  
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
  <p>Dear, <strong>${orgName}</strong>!</p>
  <p>We regret to inform you that your request to hold "<strong>${activityName}</strong>", at "<strong>${venue}</strong>", on "<strong>${displayDate}</strong>" has been <strong>REJECTED!</strong></p>
  <p>Please refer to these comments as to why your request was rejected:<br>
  SRO Comment: <strong>"${sroComments || 'No additional comments'}"</strong><br>
  ODSA Comment: <strong>"${odsaComments || 'No additional comments'}"</strong><br></p>
  <p>For your request to be approved, please send a new submission in accordance to the comments provided.</p>
  <p>Take note of your Activity Form Id: <strong>#${formCode}</strong>.</p>
  <p><strong>REMINDER: This is an automated e-mail. Kindly do not reply to this e-mail.</strong><br>
  If you have concerns, please send a separate e-mail with the subject: "<strong>Activity Concern, #${formCode}</strong>".</p>
  <p>Thank you,<br>
  <small><i>Yours in honour, excellence and service,</i></small><br><br>
  <strong>Office of Student Affairs | Student Relations Office<br>
  E-mail: sro.upbaguio@up.edu.ph</strong><br><br>
  <small><i>Please help us improve our services! Fill-out our Customer Feedback Form: UPB CFF. Thank you.</i></small><br><br>
  <small><strong>Confidentiality:</strong> The information contained in this e-mail message is intended only for the personal and confidential use of the designated recipient(s) of the same. If you are not an intended recipient of this message or an agent responsible for delivering it to an intended recipient, you are hereby notified that you have received this message in error, and that any review, dissemination, distribution, or copying of this message, in whole or in part, is strictly prohibited. If you have received this message in error, please delete it and all copies and notify me immediately by reply e-mail (sro.upbaguio@up.edu.ph). Thank you.</small></p>
</div>`;
};

/**
 * Fetches activity data needed for email templates
 */
const getActivityEmailData = async (activityId) => {
  const { data, error } = await supabase
    .from("activity")
    .select(`
      *,
      organization:organization(org_name),
      account:account(email),
      schedule:activity_schedule(start_date, end_date, start_time, end_time)
    `)
    .eq("activity_id", activityId)
    .single();

  if (error) {
    console.error("Error fetching activity data for email:", error);
    throw new Error("Failed to fetch activity data for email notification.");
  }

  // Format date for display
  let displayDate = "Date TBD";
  if (data.schedule && data.schedule.length > 0) {
    const schedule = data.schedule[0];
    const startDate = new Date(schedule.start_date);
    const endDate = schedule.end_date ? new Date(schedule.end_date) : null;
    
    if (endDate && startDate.getTime() !== endDate.getTime()) {
      displayDate = `${startDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })} - ${endDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })}`;
    } else {
      displayDate = startDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
    }
  }

  return {
    orgName: data.organization?.org_name || "Organization",
    activityName: data.activity_name,
    venue: data.venue,
    displayDate,
    formCode: data.activity_id,
    sroComments: data.sro_remarks || "",
    odsaComments: data.odsa_remarks || "",
    recipientEmail: data.account?.email
  };
};

/**
 * Sends email notification
 */
const sendEmailNotification = async (emailData, isApproval) => {
  try {
    const emailContent = isApproval 
      ? generateApprovalEmailHTML(emailData)
      : generateRejectionEmailHTML(emailData);

    const subject = `Activity ${isApproval ? 'Approved' : 'Rejected'} - ${emailData.activityName}`;

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailData.recipientEmail,
        subject: subject,
        html: emailContent
      })
    });

    if (!response.ok) {
      console.error('Failed to send email notification');
      // Don't throw error - we don't want email failure to break the approval process
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't throw error - we don't want email failure to break the approval process
  }
};

/**
 * Approves an activity based on role and sends email notification
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

  // Send email notification only when ODSA approves (final approval)
  if (userRole === 3) {
    try {
      const emailData = await getActivityEmailData(activityId);
      await sendEmailNotification(emailData, true);
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
      // Don't throw error - approval was successful even if email failed
    }
  }
}

/**
 * Rejects an activity based on role and sends email notification
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

  // Send email notification for rejection
  try {
    const emailData = await getActivityEmailData(activityId);
    await sendEmailNotification(emailData, false);
  } catch (emailError) {
    console.error("Email notification failed:", emailError);
    // Don't throw error - rejection was successful even if email failed
  }
}
