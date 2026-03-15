import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useAuth } from "@/context/UserAuthContext";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import WeeklyCalendar from "@/components/ui/WeeklyCalendar";
import StudentStatCards from "@/components/dashboard/StudentStatCards";
import QuickActions from "@/components/dashboard/QuickActions";
import StudentRecentRequests from "@/components/dashboard/StudentRecentRequests";
import FAQCard from "@/components/FAQCard";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { Calendar } from "lucide-react";

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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statCounts, setStatCounts] = useState(null);
  const navigate = useNavigate();
  const { user, email, accountId, loading: authLoading } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const init = async () => {
      try {
        await Promise.all([fetchActivities(), fetchStats(accountId)]);
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, authLoading]);

  const fetchStats = async (acctId) => {
    try {
      if (!acctId) return;

      const [pendingRes, approvedRes, applicationsRes] = await Promise.all([
        supabase
          .from("activity")
          .select("activity_id", { count: "exact", head: true })
          .eq("account_id", acctId)
          .or("final_status.is.null,final_status.eq.Pending"),
        supabase
          .from("activity")
          .select("activity_id", { count: "exact", head: true })
          .eq("account_id", acctId)
          .eq("final_status", "Approved"),
        supabase
          .from("org_recognition")
          .select("recognition_id", { count: "exact", head: true })
          .eq("account_id", acctId),
      ]);

      setStatCounts({
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
        upcoming: 0, // will be calculated from events
        applications: applicationsRes.count || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activity")
        .select(`*, organization:organization(*), schedule:activity_schedule(*), account:account(*)`)
        .eq("final_status", "Approved");

      if (error) throw error;

      let transformedEvents = [];
      data.forEach((activity) => {
        const sched = activity.schedule[0];
        if (sched?.is_recurring === "true" && sched.recurring_days) {
          const recurringDays = JSON.parse(sched.recurring_days);
          const dayMap = {
            Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
          };
          const start = new Date(sched.start_date);
          const end = new Date(sched.end_date);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayName = Object.keys(dayMap).find((key) => dayMap[key] === d.getDay());
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

      // Calculate upcoming events count (next 7 days)
      const now = new Date();
      const weekLater = new Date(now);
      weekLater.setDate(weekLater.getDate() + 7);
      const upcomingCount = transformedEvents.filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= weekLater;
      }).length;

      setStatCounts((prev) => ({ ...prev, upcoming: upcomingCount }));
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const handleEventClick = async (event) => {
    try {
      const { data, error } = await supabase
        .from("activity")
        .select(`*, account:account(*), schedule:activity_schedule(*), organization:organization(*)`)
        .eq("activity_id", event.activity_id)
        .single();

      if (!error) {
        setSelectedEvent(data);
        setIsDialogOpen(true);
      }
    } catch (err) {
      console.error("Unexpected error loading activity:", err);
    }
  };

  const handleMoreActivitiesClick = (date) => {
    navigate("/activities-calendar", { state: { selectedDate: new Date(date).toISOString() } });
  };

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || null;

  return (
    <div className="max-w-[1350px] mx-auto space-y-6">
      {/* Greeting Hero */}
      <AnimatedContainer>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              {greeting},{" "}
              {firstName ? (
                <span className="animate-[fadeIn_0.4s_ease-in-out]">{firstName}!</span>
              ) : (
                <Skeleton className="h-8 w-32 inline-block rounded" />
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's what's happening with your activities today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-sro-primary bg-white px-3 py-1.5 rounded-full border shadow-sm">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </AnimatedContainer>

      {/* Stats Row */}
      <StudentStatCards counts={statCounts} loading={loading} />

      {/* Bento Grid */}
      <AnimatedContainer delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-6">
          {/* Calendar - spans 3 cols and 2 rows */}
          <div className="lg:col-span-3 lg:row-span-2">
            <WeeklyCalendar
              events={events}
              loading={loading}
              onEventClick={handleEventClick}
              calendarLink="/activities-calendar"
              onMoreActivitiesClick={handleMoreActivitiesClick}
            />
          </div>

          {/* Quick Actions - right side top */}
          <div className="lg:col-span-2">
            <QuickActions />
          </div>

          {/* Recent Requests - right side bottom */}
          <div className="lg:col-span-2">
            <StudentRecentRequests />
          </div>
        </div>
      </AnimatedContainer>

      {/* Help Center */}
      <AnimatedContainer delay={0.25}>
        <FAQCard />
      </AnimatedContainer>

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
