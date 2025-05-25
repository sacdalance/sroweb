import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Eye, Loader2 } from "lucide-react";
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

const ActivitiesCalendar = () => {
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
        const transformedEvents = data.map(activity => ({
          id: activity.activity_id,
          date: new Date(activity.schedule[0]?.start_date),
          title: activity.activity_name,
          time: `${activity.schedule[0]?.start_time} to ${activity.schedule[0]?.end_time}`,
          location: activity.venue,
          category: activity.activity_type,
          organization: activity.organization?.org_name,
          description: activity.activity_description,
          partners: activity.university_partner,
          sdgs: activity.sdg_goals,
          venue: activity.venue
        }));

        setEvents(transformedEvents);

        // Set upcoming events (events from today onwards)
        const today = new Date();
        const upcoming = transformedEvents
          .filter(event => event.date >= today)
          .sort((a, b) => a.date - b.date)
          .slice(0, 5);

        setUpcomingEvents(upcoming.map(event => ({
          id: event.id,
          date: event.date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          title: event.title,
          organization: event.organization,
          type: event.category,
          venue: event.venue
        })));

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

  // Get color for event based on category
  const getEventColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'academic':
        return 'bg-green-100 text-[#014421]';
      case 'cultural':
        return 'bg-blue-100 text-blue-700';
      case 'sports':
        return 'bg-amber-100 text-amber-700';
      case 'service':
        return 'bg-purple-100 text-purple-700';
      case 'educational':
        return 'bg-green-100 text-[#014421]';
      default:
        return 'bg-red-100 text-[#7B1113]';
    }
  };

  // Fetch full activity details when eye is clicked
  const handleEventClick = async (event) => {
    setModalLoading(true);
    setIsDialogOpen(true);
    setSelectedEvent(null);

    // Fetch full activity details from Supabase
    const { data, error } = await supabase
      .from("activity")
      .select(`
        *,
        account:account(*),
        schedule:activity_schedule(*),
        organization:organization(*)
      `)
      .eq("activity_id", event.id)
      .single();

    if (error) {
      console.error("Failed to fetch activity details:", error);
      setSelectedEvent(event); // fallback to minimal
    } else {
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

  return (
    <div className="container mx-auto py-8 max-w-6xl sm:px-4 md:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">Activities Calendar</h1>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
        <Button
          className="w-full sm:w-auto bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4 mr-2" /> Print Calendar
        </Button>
      </div>

      <Card className="rounded-lg shadow-md mb-6">
        <CardContent className="p-2 sm:p-6">
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
              getEventColor={getEventColor}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="text-sm font-medium">Legend:</div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-100 mr-1"></div>
          <span className="text-xs text-[#014421]">Academic</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-100 mr-1"></div>
          <span className="text-xs text-blue-700">Cultural</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-100 mr-1"></div>
          <span className="text-xs text-amber-700">Sports</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-100 mr-1"></div>
          <span className="text-xs text-purple-700">Service</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-100 mr-1"></div>
          <span className="text-xs text-[#7B1113]">Special Event</span>
        </div>
      </div>

      <Card className="rounded-lg shadow-md">
        <CardHeader className="bg-white py-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-[#7B1113]">
            Upcoming Activities
          </CardTitle>
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
              <div className="max-h-[350px] overflow-y-auto"> {/* Add this wrapper */}
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Date</th>
                      <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Activity</th>
                      <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5k">Organization</th>
                      <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Type</th>
                      <th className="min-w-[120px] w-[150px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5">Venue</th>
                      <th className="w-[70px] text-xs sm:text-sm font-semibold text-center py-3 sm:py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {upcomingEvents.map((event, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">
                          {event.date}
                        </td>
                        <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">
                          {event.title}
                        </td>
                        <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">
                          {event.organization}
                        </td>
                        <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4 align-middle">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event.type)}`}
                            style={{
                              whiteSpace: "pre-line", // allow line breaks
                              wordBreak: "break-word",
                              lineHeight: "1.3",
                              minHeight: "2.2em", // keeps pill shape even for one line
                              maxWidth: "100%",
                              boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)"
                            }}
                          >
                            {categoryMap[event.type] || event.type}
                          </span>
                        </td>
                        <td className="min-w-[120px] w-[150px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">
                          {event.venue}
                        </td>
                        <td className="w-[70px] text-xs sm:text-sm text-center py-3 sm:py-5 px-4">
                          <button
                            onClick={() => handleEventClick(event)}
                            className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
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

export default ActivitiesCalendar;
