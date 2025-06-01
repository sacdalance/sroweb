import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import supabase from "@/lib/supabase";
import { toast } from "sonner";
import CustomCalendar from "@/components/ui/custom-calendar";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import PropTypes from 'prop-types';

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

const AdminActivitiesCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Month and year options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = ["2024", "2025", "2026", "2027", "2028"];

  // Selected values for dropdowns
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organization')
          .select('org_id, org_name');

        if (error) throw error;
        setOrganizations(
          data
            .map(org => org.org_name)
            .sort((a, b) => a.localeCompare(b))
        );
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
      }
    };

    fetchOrganizations();
  }, []);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: activitiesError } = await supabase
          .from('activity')
          .select(`
            *,
            organization:organization(*),
            schedule:activity_schedule(*)
          `)
          .eq('final_status', 'Approved');

        if (activitiesError) throw activitiesError;

        // Transform the data
        let transformedEvents = [];
        data.forEach(activity => {
          const schedule = activity.schedule[0];
          if (schedule?.is_recurring && schedule.recurring_days) {
            // Recurring event: generate events for each matching day
            const recurringDays = typeof schedule.recurring_days === 'string' ? JSON.parse(schedule.recurring_days) : schedule.recurring_days;
            const start = new Date(schedule.start_date);
            const end = new Date(schedule.end_date);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
              if (recurringDays[dayName]) {
                transformedEvents.push({
                  id: activity.activity_id + '-' + d.toISOString().slice(0, 10),
                  date: new Date(d),
                  title: activity.activity_name,
                  time: `${schedule.start_time} to ${schedule.end_time}`,
                  location: activity.venue,
                  category: activity.activity_type,
                  organization: activity.organization?.org_name,
                  description: activity.activity_description,
                  partners: activity.university_partner,
                  sdgs: activity.sdg_goals,
                  venue: activity.venue,
                  isRecurringInstance: true
                });
              }
            }
          } else {
            // Non-recurring event
            transformedEvents.push({
              id: activity.activity_id,
              date: new Date(schedule?.start_date),
              title: activity.activity_name,
              time: `${schedule?.start_time} to ${schedule?.end_time}`,
              location: activity.venue,
              category: activity.activity_type,
              organization: activity.organization?.org_name,
              description: activity.activity_description,
              partners: activity.university_partner,
              sdgs: activity.sdg_goals,
              venue: activity.venue,
              isRecurringInstance: false
            });
          }
        });

        setEvents(transformedEvents);        // Set upcoming events (events in next 30 days)
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const upcoming = transformedEvents
          .filter(event => event.date >= today && event.date <= thirtyDaysFromNow)
          .sort((a, b) => a.date - b.date);

        // Group events by week
        const upcomingGrouped = upcoming.map(event => {
          const eventDate = event.date;
          const diffTime = Math.abs(eventDate - today);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let timeframe;
          let relativeDate;

          if (diffDays === 0) {
            timeframe = "Today";
            relativeDate = "Today";
          } else if (diffDays === 1) {
            timeframe = "Tomorrow";
            relativeDate = "Tomorrow";
          } else if (diffDays <= 7) {
            timeframe = "This Week";
            relativeDate = `In ${diffDays} days`;
          } else if (diffDays <= 14) {
            timeframe = "Next Week";
            relativeDate = `In ${diffDays} days`;
          } else {
            timeframe = "Later This Month";
            relativeDate = eventDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric'
            });
          }

          return {
            id: event.id,
            timeframe,
            relativeDate,
            absoluteDate: eventDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            title: event.title,
            organization: event.organization,
            type: categoryMap[event.category] || event.category,
            venue: event.venue,
            time: event.time,
            startDate: event.date,
            endDate: event.endDate
          };
        });

        setUpcomingEvents(upcomingGrouped);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err.message);
        toast.error('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Update month/year when dropdowns change
  const handleMonthChange = (value) => {
    setSelectedMonth(value);
    const monthIndex = months.indexOf(value);
    setCurrentDate(new Date(parseInt(selectedYear), monthIndex));
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    const monthIndex = months.indexOf(selectedMonth);
    setCurrentDate(new Date(parseInt(value), monthIndex));
  };

  // Sync dropdowns with calendar navigation
  useEffect(() => {
    const month = currentDate.toLocaleString("default", { month: "long" });
    const year = currentDate.getFullYear().toString();
    if (selectedMonth !== month) handleMonthChange(month);
    if (selectedYear !== year) handleYearChange(year);
    // eslint-disable-next-line
  }, [currentDate]);

  // Add a helper to check if an event is recurring
  const isRecurringEvent = (event) => typeof event.id === 'string' && event.id.includes('-') && event.id.split('-')[1].length === 10;

  // Update getEventColor to use orange for recurring events
  const getEventColor = (category, event) => {
    if (event && event.isRecurringInstance) return 'bg-orange-200 text-orange-800';
    return 'bg-red-100 text-[#7B1113]';
  };

  // Update handleEventClick to fetch the correct activity for recurring events
  const handleEventClick = async (event) => {
    setModalLoading(true);
    setIsDialogOpen(true);
    setSelectedEvent(null);
    let baseId = event.id;
    let overrideDate = null;
    if (isRecurringEvent(event)) {
      baseId = event.id.split('-')[0];
      overrideDate = event.date;
    }
    // Fetch full activity details from Supabase
    const { data, error } = await supabase
      .from("activity")
      .select(`*, account:account(*), schedule:activity_schedule(*), organization:organization(*)`)
      .eq("activity_id", baseId)
      .single();
    if (error) {
      console.error("Failed to fetch activity details:", error);
      setSelectedEvent(event); // fallback to minimal
    } else {
      // If recurring, override the schedule date/time for the dialog
      if (overrideDate && data.schedule && data.schedule[0]) {
        data.schedule = [{
          ...data.schedule[0],
          start_date: overrideDate,
          end_date: overrideDate
        }];
      }
      setSelectedEvent(data);
    }
    setModalLoading(false);
  };

  // Loading state component
  const LoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-[#7B1113]" />
      <span className="ml-2 text-[#7B1113]">Loading activities...</span>
    </div>
  );

  // Error state component with prop validation
  const ErrorState = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-8 text-[#7B1113]">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="text-sm text-gray-600">{message}</p>
      <Button
        onClick={() => window.location.reload()}
        className="mt-4 bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
      >
        Try Again
      </Button>
    </div>
  );

  ErrorState.propTypes = {
    message: PropTypes.string.isRequired
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <p className="text-lg font-semibold">No activities found</p>
      <p className="text-sm">There are no approved activities to display.</p>
    </div>
  );

  const formatTime = (timeString) => {
    const [startTime, endTime] = timeString.split(' to ').map(time => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      if (hour === 12) return `${hour}:${minutes}NN`;
      return hour > 12
        ? `${hour - 12}:${minutes}PM`
        : `${hour}:${minutes}AM`;
    });
    return `${startTime} to ${endTime}`;
  };

  const [expandedText, setExpandedText] = useState({});

  const toggleText = (id, type, e) => {
    // Make sure to stop event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedText(prev => ({
      ...prev,
      [type + id]: !prev[type + id]
    }));
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl sm:px-4 md:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">Activities Calendar</h1>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
        <div className=" flex flex-col sm:flex-row gap-4 flex-1">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org} value={org}>
                  {org}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="rounded-lg shadow-md border border-gray-200 bg-white"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <CustomCalendar
            mode="activities"
            currentMonth={currentDate}
            onDateSelect={handleEventClick}
            onMonthChange={setCurrentDate}
            events={events.filter(event =>
              selectedOrganization === "all" || event.organization === selectedOrganization
            )}
            getEventColor={(category, event) => getEventColor(category, event)}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-block w-4 h-4 rounded-full bg-orange-200 border border-orange-400"></span>
          <span className="text-xs text-orange-800 font-medium">Recurring Event</span>
        </div>
      </div>

      <Card className="rounded-lg shadow-md">        <CardHeader className="bg-white py-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg sm:text-xl font-bold text-[#7B1113]">
            Upcoming Activities
          </CardTitle>
          <Badge variant="outline" className="text-[#014421]">
            Next 30 Days
          </Badge>
        </div>
      </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : upcomingEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[350px] overflow-y-auto">                <table className="w-full min-w-[500px]">                  <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-[100px] text-xs font-semibold text-left py-2 px-3">When</th>
                  <th className="w-[120px] text-xs font-semibold text-left py-2 px-3">Activity</th>
                  <th className="w-[120px] text-xs font-semibold text-left py-2 px-3">Organization</th>
                  <th className="w-[120px] text-xs font-semibold text-center py-2 px-3">Type</th>
                  <th className="w-[100px] text-xs font-semibold text-left py-2 px-3">Venue</th>
                </tr>
              </thead>
                <tbody>
                  {[...new Set(upcomingEvents.map(event => event.timeframe))].map(timeframe => (
                    <React.Fragment key={timeframe}>
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-2 font-semibold text-sm text-[#014421]">
                          {timeframe}
                        </td>
                      </tr>
                      {upcomingEvents
                        .filter(event => event.timeframe === timeframe)
                        .map((event, index) => (<tr key={`${timeframe}-${index}`}
                          onClick={() => handleEventClick(event)}
                          className="group hover:bg-[#014421]/5 border-b border-gray-200 cursor-pointer transition-all duration-150 hover:shadow relative">
                          <td className="w-[100px] text-xs py-2 px-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-[#7B1113]">{event.relativeDate}</span>
                              <span className="text-gray-500 text-xs">{event.absoluteDate}</span>
                              <span className="text-gray-500 text-xs mt-0.5">{formatTime(event.time)}</span>
                            </div>
                          </td>
                          <td className="w-[120px] text-xs py-2 px-3">
                            <div className="flex items-center gap-1">
                              <div className="transition-all duration-200">
                                {expandedText['title' + event.id] ? event.title :
                                  event.title.length > 50 ? `${event.title.substring(0, 50)}...` : event.title}
                              </div>
                              {event.title.length > 50 && (
                                <button
                                  onClick={(e) => toggleText(event.id, 'title', e)}
                                  className="text-gray-500 hover:text-[#7B1113] transition-transform"
                                >
                                  <svg
                                    className={`h-4 w-4 transform transition-transform ${expandedText['title' + event.id] ? 'rotate-180' : ''
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="w-[120px] text-xs py-2 px-3">
                            <div className="flex items-center gap-1">
                              <div className="transition-all duration-200">
                                {expandedText['org' + event.id] ? event.organization :
                                  event.organization.length > 50 ? `${event.organization.substring(0, 50)}...` : event.organization}
                              </div>
                              {event.organization.length > 50 && (
                                <button
                                  onClick={(e) => toggleText(event.id, 'org', e)}
                                  className="text-gray-500 hover:text-[#7B1113] transition-transform"
                                >
                                  <svg
                                    className={`h-4 w-4 transform transition-transform ${expandedText['org' + event.id] ? 'rotate-180' : ''
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="w-[80px] text-xs py-2 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event.type, event)}`}
                              style={{
                                whiteSpace: "pre-line",
                                wordBreak: "break-word",
                                lineHeight: "1.3",
                                minHeight: "2.2em",
                                maxWidth: "100%",
                                boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)"
                              }}
                            >
                              {categoryMap[event.type] || event.type}
                            </span>
                          </td>                                <td className="w-[100px] text-xs py-2 px-3">
                            <span className="truncate block" title={event.venue}>
                              {event.venue}
                            </span>
                          </td>
                        </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {modalLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-[#7B1113]" />
          </div>
        ) : (
          selectedEvent && (
            <ActivityDialogContent
              activity={selectedEvent}
              setActivity={setSelectedEvent}
              isModalOpen={isDialogOpen}
              readOnly={true}
            />
          )
        )}
      </Dialog>
    </div>
  );
};

export default AdminActivitiesCalendar;