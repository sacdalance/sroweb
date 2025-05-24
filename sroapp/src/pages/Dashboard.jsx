import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import FAQCard from "@/components/FAQCard";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";

const Dashboard = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);

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
            schedule:activity_schedule(*)
          `)
          .eq("final_status", "Approved");

        if (error) throw error;

        // Transform the data to match our events structure
        const transformedEvents = data.map((activity) => {
          // Format time to show only hours and minutes
          const startTime = activity.schedule[0]?.start_time
            ? new Date(`1970-01-01T${activity.schedule[0].start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "00:00";
          const endTime = activity.schedule[0]?.end_time
            ? new Date(`1970-01-01T${activity.schedule[0].end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "00:00";

          // Map category to user-friendly label
          const categoryLabel = categoryMap[activity.activity_type] || "Others";

          return {
            id: activity.activity_id,
            name: activity.activity_name,
            time: `${startTime} to ${endTime}`,
            location: activity.venue,
            category: categoryLabel, // Use the mapped label
            organization: activity.organization?.org_name,
            date: activity.schedule[0]?.start_date,
          };
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
        <div className="max-w-[1350px] px-9 mx-auto" >
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
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 p-0 border-[#014421] text-[#014421] rounded-md"
                          onClick={() => handleWeekNavigation("prev")}
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-medium px-1 text-center leading-tight whitespace-nowrap">
                          {getWeekRange(currentWeekStart)}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 p-0 border-[#014421] text-[#014421] rounded-md"
                          onClick={() => handleWeekNavigation("next")}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
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
                                      className="bg-[#7B1113] rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] w-full max-w-full mx-auto justify-between"
                                      style={{ width: "100%", maxWidth: "100%" }}
                                    >
                                      {/* Top Row: Location + Time Slot */}
                                      <div className="flex items-center mb-1 min-w-0">
                                        <span className="text-white text-xs truncate flex-1 min-w-0">{dayEvents[0].location}</span>
                                        <span className="text-white text-xs ml-2 flex-shrink-0 truncate">{dayEvents[0].time}</span>
                                      </div>
                                      {/* Activity Name */}
                                      <h3 className="text-white font-bold text-base mb-1 truncate">{dayEvents[0].name}</h3>
                                      {/* Organization and Category */}
                                      <div className="flex flex-row items-start gap-2 min-w-0 w-full">
                                        <span className="text-white text-sm truncate flex-1 min-w-0">{dayEvents[0].organization}</span>
                                        <span className="text-white/80 italic text-xs sm:text-sm text-right flex-shrink-0">{dayEvents[0].category}</span>
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
                                        className="bg-[#7B1113] rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] flex-1 basis-[220px] max-w-full justify-between"
                                        style={{ minWidth: 0 }}
                                      >
                                        <div className="flex items-center mb-1 min-w-0">
                                          <span className="text-white text-xs truncate flex-1 min-w-0">{event.location}</span>
                                          <span className="text-white text-xs ml-2 flex-shrink-0 truncate">{event.time}</span>
                                        </div>
                                        <h3 className="text-white font-bold text-base mb-1 truncate">{event.name}</h3>
                                        <div className="flex flex-row items-start gap-2 min-w-0 w-full">
                                          <span className="text-white text-sm truncate flex-1 min-w-0">{event.organization}</span>
                                          <span className="text-white/80 italic text-xs sm:text-sm text-right flex-shrink-0">{event.category}</span>
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
        </div>
    );
};

export default Dashboard;
