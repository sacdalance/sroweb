import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import FAQCard from "@/components/FAQCard";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import StudentActivityDialogContent from "@/components/admin/StudentActivityDialogContent";

const Dashboard = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Function to check if a date falls within the current week
  const isDateInCurrentWeek = (dateString) => {
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0); // Normalize time to start of day

    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);

    return eventDate >= weekStart && eventDate <= weekEnd;
  };

  // Function to format date range
  const getWeekRange = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startMonth = start.toLocaleString('default', { month: 'long' }).toUpperCase();
    const endMonth = end.toLocaleString('default', { month: 'long' }).toUpperCase();

    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  };

  // Function to handle week navigation
  const handleWeekNavigation = (direction) => {
    const newDate = new Date(currentWeekStart);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    newDate.setDate(newDate.getDate() - newDate.getDay());
    setCurrentWeekStart(newDate);
  };

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

  // Filter events for the current week
  const filteredEvents = events.filter(event => isDateInCurrentWeek(event.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentWeekStartDate = new Date(currentWeekStart);
  currentWeekStartDate.setHours(0, 0, 0, 0);
  const currentWeekEndDate = new Date(currentWeekStart);
  currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 6);
  currentWeekEndDate.setHours(23, 59, 59, 999);

  const isCurrentWeek =
    today >= currentWeekStartDate && today <= currentWeekEndDate;

  // Always filter events for the current week
  const weekEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= currentWeekStartDate && eventDate <= currentWeekEndDate;
      }),
    [events, currentWeekStart]
  );

  // Then, for current week, filter for today only
  const eventsToShow = isCurrentWeek
    ? weekEvents.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    })
    : weekEvents;

  return (
    <div className="max-w-[1350px] mx-auto mb-8" >
      <Card className="shadow-sm px-6 py-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
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

        {/* Activities Calendar Section */}
        <Card className="shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-[#7B1113]">Activities Calendar</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0 border-1 border-[#014421] text-[#014421] rounded-full bg-white hover:bg-[#f3f4f6] shadow-none"
                  onClick={() => handleWeekNavigation("prev")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="text-xs font-medium px-1 text-center leading-tight whitespace-nowrap">
                  {(() => {
                    const range = getWeekRange(currentWeekStart);
                    return range;
                  })()}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0 border-1 border-[#014421] text-[#014421] rounded-full bg-white hover:bg-[#f3f4f6] shadow-none"
                  onClick={() => handleWeekNavigation("next")}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
            {/* Legend for recurring activities */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-4 h-4 rounded border-4 border-[#F3AA2C] bg-white"></span>
              <span className="text-xs text-gray-700">Recurring Activity</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-10 text-center text-gray-600">
                <Loader2 className="h-6 w-6 mb-2 animate-spin text-[#7B1113]" />
                <p>Loading Calendar...</p>
              </div>
            ) : (
              <div className="w-full">
                {/* Desktop/tablet: Days left, cards right (vertical) */}
                <div className="hidden sm:grid grid-cols-[70px_1fr] gap-2">
                  {/* Days of the week */}
                  <div className="flex flex-col gap-2 h-full">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(currentWeekStart);
                      date.setDate(date.getDate() - date.getDay() + i);
                      const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i];
                      const isToday = new Date().toDateString() === date.toDateString();
                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center justify-center rounded-lg w-16 h-[100px]
                                    ${isToday ? "bg-[#F3AA2C] text-[#7B1113] font-bold border-2 border-[#F3AA2C] shadow" : ""}
                                  `}
                        >
                          <span className="text-xs">{day}</span>
                          <span className="text-base">{date.getDate()}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Activity cards in vertical stack */}
                  <div className="flex flex-col gap-2 h-full min-w-0">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(currentWeekStart);
                      date.setDate(date.getDate() - date.getDay() + i);
                      date.setHours(0, 0, 0, 0);

                      const dayEvents = events.filter(event => {
                        const eventDate = new Date(event.date);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate.getTime() === date.getTime();
                      });

                      return (
                        <div key={i} className="flex-1 min-w-0">
                          {dayEvents.length > 0 ? (
                            <div
                              key={dayEvents[0].id}
                              className={`bg-[#7B1113] rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] w-full max-w-full mx-auto relative cursor-pointer hover:bg-[#8b1416] transition-colors ${dayEvents[0].is_recurring === "true" ? "border-4 border-[#F3AA2C]" : ""}`}
                              onClick={async () => {
                                try {
                                  const { data, error } = await supabase
                                    .from("activity")
                                    .select(`
                                                *,
                                                account:account(*),
                                                schedule:activity_schedule(*),
                                                organization:organization(*)
                                              `)
                                    .eq("activity_id", dayEvents[0].activity_id)
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
                              }}
                            >
                              {/* Activity Name and Time */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="text-white font-bold text-base truncate flex-1">{dayEvents[0].name}</h3>
                                <span className="text-white text-xs flex-shrink-0">{dayEvents[0].time}</span>
                              </div>
                              {/* Organization Name */}
                              <span className="text-white/90 text-sm truncate mb-auto">{dayEvents[0].organization}</span>
                              {/* Bottom Row: Location and Activity Count */}
                              <div className="flex items-center justify-between mt-1">
                                {dayEvents[0].is_recurring === "true" ? (
                                  <>
                                    <span className="text-white/80 text-xs truncate">
                                      {(() => {
                                        const sched = dayEvents[0].schedule?.[0] || {};
                                        const start = sched.start_date ? new Date(sched.start_date) : null;
                                        const end = sched.end_date ? new Date(sched.end_date) : null;
                                        return start && end ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : null;
                                      })()}
                                    </span>
                                    <span className="block text-white/80 text-[11px] mt-1 truncate">
                                      {(() => {
                                        const sched = dayEvents[0].schedule?.[0] || {};
                                        const recurringDays = sched.recurring_days ? JSON.parse(sched.recurring_days) : {};
                                        const daysList = Object.keys(recurringDays).filter(day => recurringDays[day]);
                                        return daysList.length > 0 ? daysList.join(", ") : null;
                                      })()}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-white/80 text-xs truncate">{dayEvents[0].date}</span>
                                )}
                                {dayEvents.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      const date = new Date(dayEvents[0].date);
                                      navigate('/activities-calendar', { state: { selectedDate: date.toISOString() } });
                                    }}
                                    className="bg-[#F3AA2C] text-[#7B1113] text-xs font-bold px-2 py-0.5 rounded-full ml-2 whitespace-nowrap hover:bg-[#f4b544] transition-colors"
                                  >
                                    +{dayEvents.length - 1} More {dayEvents.length - 1 === 1 ? 'Activity' : 'Activities'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg overflow-hidden border border-gray-200 h-[100px] w-full max-w-full mx-auto flex items-center justify-center">
                              <span className="text-gray-500 text-sm truncate">No Activities</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Mobile: Days left, cards horizontally aligned with no scroll */}
                <div className="sm:hidden flex flex-col gap-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(currentWeekStart);
                    date.setDate(date.getDate() - date.getDay() + i);
                    date.setHours(0, 0, 0, 0);

                    const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i];
                    const isToday = new Date().toDateString() === date.toDateString();

                    const dayEvents = events.filter(event => {
                      const eventDate = new Date(event.date);
                      eventDate.setHours(0, 0, 0, 0);
                      return eventDate.getTime() === date.getTime();
                    });

                    return (
                      <div key={i} className="flex flex-row items-center gap-2 w-full">
                        {/* Day label aligned with cards */}
                        <div
                          className={`flex flex-col items-center justify-center rounded-lg w-16 h-[100px] flex-shrink-0
                                    ${isToday ? "bg-[#F3AA2C] text-[#7B1113] font-bold border-2 border-[#F3AA2C] shadow" : ""}
                                  `}
                        >
                          <span className="text-xs">{day}</span>
                          <span className="text-base">{date.getDate()}</span>
                        </div>
                        {/* Cards for this day (no horizontal scroll) */}
                        <div className="flex flex-row flex-wrap gap-2 w-full min-w-0">
                          {dayEvents.length > 0 ? (
                            dayEvents.map(event => (
                              <div
                                key={event.id}
                                className={`bg-[#7B1113] rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] flex-1 basis-[220px] max-w-full relative cursor-pointer hover:bg-[#8b1416] transition-colors ${event.is_recurring === "true" ? "border-4 border-[#F3AA2C]" : ""}`}
                                style={{ minWidth: 0 }}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsDialogOpen(true);
                                }}
                              >
                                {/* Activity Name and Time */}
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h3 className="text-white font-bold text-base truncate flex-1">{event.name}</h3>
                                  <span className="text-white text-xs flex-shrink-0">{event.time}</span>
                                </div>
                                {/* Organization Name */}
                                <span className="text-white/90 text-sm truncate mb-auto">{event.organization}</span>
                                {/* Bottom Row: Location and Activity Count */}
                                <div className="flex items-center justify-between mt-1">
                                  {event.is_recurring === "true" ? (
                                    <>
                                      <span className="text-white/80 text-xs truncate">
                                        {(() => {
                                          const sched = event.schedule?.[0] || {};
                                          const start = sched.start_date ? new Date(sched.start_date) : null;
                                          const end = sched.end_date ? new Date(sched.end_date) : null;
                                          return start && end ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : null;
                                        })()}
                                      </span>
                                      <span className="block text-white/80 text-[11px] mt-1 truncate">
                                        {(() => {
                                          const sched = event.schedule?.[0] || {};
                                          const recurringDays = sched.recurring_days ? JSON.parse(sched.recurring_days) : {};
                                          const daysList = Object.keys(recurringDays).filter(day => recurringDays[day]);
                                          return daysList.length > 0 ? daysList.join(", ") : null;
                                        })()}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-white/80 text-xs truncate">{event.date}</span>
                                  )}
                                  {dayEvents.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        const date = new Date(event.date);
                                        navigate('/activities-calendar', { state: { selectedDate: date.toISOString() } });
                                      }}
                                      className="bg-[#F3AA2C] text-[#7B1113] text-xs font-bold px-2 py-0.5 rounded-full ml-2 whitespace-nowrap hover:bg-[#f4b544] transition-colors"
                                    >
                                      +{dayEvents.length - 1} More {dayEvents.length - 1 === 1 ? 'Activity' : 'Activities'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-lg overflow-hidden border border-gray-200 h-[100px] flex-1 basis-[220px] max-w-full flex items-center justify-center min-w-0">
                              <span className="text-gray-500 text-sm truncate">No Activities</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
          <div className="flex justify-center mt-auto border-t pt-4">
            <Link to="/activities-calendar">
              <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                See Activities Calendar <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Activity Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedEvent && (
          <StudentActivityDialogContent
            activity={selectedEvent}
            isModalOpen={isDialogOpen}
          />
        )}
      </Dialog>
    </div >
  );
};

export default Dashboard;
