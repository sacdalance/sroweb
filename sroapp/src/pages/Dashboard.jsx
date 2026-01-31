import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import FAQCard from "@/components/FAQCard";
import { Dialog } from "@/components/ui/dialog";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import WeeklyCalendar from "@/components/ui/WeeklyCalendar";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const categoryMap = {
    charitable: "Charitable",
    serviceWithinUPB: "Service (within UPB)",
    serviceOutsideUPB: "Service (outside UPB)",
    contestWithinUPB: "Contest (within UPB)",
    contestOutsideUPB: "Contest (outside UPB)",
    educational: "Educational",
    incomeGenerating: "Income-Generating Project",
    massOrientation: "Mass Orientation/General Assembly",
    booth: "Booth",
    rehearsals: "Rehearsals/Preparation",
    specialEvents: "Special Event",
    others: "Others",
  };

  // Fetch activities from Supabase
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activity")
        .select(`
            *,
            organization:organization(*),
            schedule:activity_schedule(*),
            account:account(*)
          `)
        .eq("final_status", "Approved");

      if (error) throw error;

      // Transform the data to match our events structure
      let transformedEvents = [];
      data.forEach((activity) => {
        const sched = activity.schedule[0];
        if (sched?.is_recurring === "true" && sched.recurring_days) {
          // Recurring event: expand to all matching days
          const recurringDays = JSON.parse(sched.recurring_days);
          const dayMap = {
            Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
          };
          const start = new Date(sched.start_date);
          const end = new Date(sched.end_date);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayName = Object.keys(dayMap).find(key => dayMap[key] === d.getDay());
            if (recurringDays[dayName]) {
              const startTime = sched.start_time
                ? new Date(`1970-01-01T${sched.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "00:00";
              const endTime = sched.end_time
                ? new Date(`1970-01-01T${sched.end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "00:00";
              transformedEvents.push({
                ...activity,
                id: activity.activity_id + "_" + d.toISOString().slice(0, 10),
                name: activity.activity_name,
                time: `${startTime} to ${endTime}`,
                location: activity.venue,
                category: categoryMap[activity.activity_type] || "Others",
                organization: activity.organization?.org_name,
                date: d.toISOString().slice(0, 10),
                is_recurring: "true",
                recurring_days: sched.recurring_days,
              });
            }
          }
        } else if (sched) {
          // Non-recurring event
          const startTime = sched.start_time
            ? new Date(`1970-01-01T${sched.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "00:00";
          const endTime = sched.end_time
            ? new Date(`1970-01-01T${sched.end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "00:00";
          transformedEvents.push({
            ...activity,
            id: activity.activity_id,
            name: activity.activity_name,
            time: `${startTime} to ${endTime}`,
            location: activity.venue,
            category: categoryMap[activity.activity_type] || "Others",
            organization: activity.organization?.org_name,
            date: sched.start_date,
            is_recurring: "false",
          });
        }
      });
      setEvents(transformedEvents);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Handle event click - fetch full activity details and open dialog
  const handleEventClick = async (event) => {
    try {
      const { data, error } = await supabase
        .from("activity")
        .select(`
          *,
          account:account(*),
          schedule:activity_schedule(*),
          organization:organization(*)
        `)
        .eq("activity_id", event.activity_id)
        .single();

      if (!error) {
        setSelectedEvent(data);
        setIsDialogOpen(true);
      } else {
        console.error("Error loading full activity:", error.message);
      }
    } catch (err) {
      console.error("Unexpected error loading activity:", err);
    }
  };

  // Handle more activities click - navigate to calendar with selected date
  const handleMoreActivitiesClick = (date) => {
    navigate('/activities-calendar', { state: { selectedDate: new Date(date).toISOString() } });
  };

  return (
    <div className="max-w-[1350px] mx-auto mb-8" >
      <Card className="shadow-sm px-6 py-4 mb-6">
        <div className="space-y-1">
          <h2 className="page-header text-black">
            Welcome to SRO All-in-One Web App
          </h2>
          <p className="text-sm text-muted-foreground">
            This portal allows you to manage your organization activities and requests. Use the sidebar to navigate through different sections.
          </p>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* FAQ Section */}
        <FAQCard />

        {/* Activities Calendar Section - Unified Component */}
        <WeeklyCalendar
          events={events}
          loading={loading}
          onEventClick={handleEventClick}
          calendarLink="/activities-calendar"
          onMoreActivitiesClick={handleMoreActivitiesClick}
        />
      </div>

      {/* Activity Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedEvent && (
          <ActivityDialogContent
            activity={selectedEvent}
            isModalOpen={isDialogOpen}
            readOnly={true}
            publicView={true}
          />
        )}
      </Dialog>
    </div>
  );
};

export default Dashboard;
