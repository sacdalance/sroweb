import UnifiedActivitiesCalendar from "@/components/ui/UnifiedActivitiesCalendar";
import StudentActivityDialogContent from "@/components/admin/StudentActivityDialogContent";
import supabase from "@/lib/supabase";

const fetchActivities = async () => {
  const { data, error } = await supabase
    .from('activity')
    .select(`*, organization:organization(*), schedule:activity_schedule(*)`)
    .eq('final_status', 'Approved');
  if (error) throw error;
  return data;
};

const fetchOrganizations = async () => {
  const { data, error } = await supabase
    .from('organization')
    .select('org_id, org_name');
  if (error) throw error;
  return data.map(org => org.org_name).sort((a, b) => a.localeCompare(b));
};

const fetchDialogActivity = async (activityId) => {
  const { data, error } = await supabase
    .from("activity")
    .select(`*, account:account(*), schedule:activity_schedule(*), organization:organization(*)`)
    .eq("activity_id", activityId)
    .single();
  if (error) throw error;
  return data;
};

export default function ActivitiesCalendar() {
  return (
    <UnifiedActivitiesCalendar
      dialogComponent={StudentActivityDialogContent}
      fetchActivities={fetchActivities}
      fetchOrganizations={fetchOrganizations}
      fetchDialogActivity={fetchDialogActivity}
      calendarTitle="Activities Calendar"
    />
  );
}
