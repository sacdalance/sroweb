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
import PropTypes from 'prop-types';

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
        setOrganizations(data.map(org => org.org_name));
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

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
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
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Activities Calendar</h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-32">
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
          <SelectTrigger className="w-64">
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
        
        <Button 
          className="ml-auto bg-[#7B1113] hover:bg-[#5e0d0e] text-white" 
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4 mr-2" /> Print Calendar
        </Button>
      </div>

      <Card className="rounded-lg shadow-md mb-6">
        <CardContent className="p-6">
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
              monthOptions={months}
              yearOptions={years}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
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
          <CardTitle className="text-xl font-bold text-[#7B1113]">
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
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-medium text-black">Date</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-black">Activity</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-black">Organization</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-black">Type</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-black">Venue</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-black"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingEvents.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {event.date}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 font-medium">
                        {event.title}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {event.organization}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                          {event.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {event.venue}
                      </td>
                      <td className="px-5 py-4 text-sm flex justify-center">
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
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[1000px] w-[90vw] sm:w-[85vw] mx-auto">
          <DialogHeader className="px-2">
            <DialogTitle className="text-xl font-bold text-[#7B1113]">Activity Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6 px-2">
              {/* Activity Title, Description and Organization */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selectedEvent.title}</h2>
                <p className="text-sm text-gray-600">{selectedEvent.organization}</p>
                <p className="text-sm text-gray-700 mt-2">{selectedEvent.description || "No description available"}</p>
              </div>

              {/* General Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">General Information</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Activity Type:</span>
                    <span>{selectedEvent.type}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Date:</span>
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Time:</span>
                    <span>{selectedEvent.time}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue:</span>
                    <span>{selectedEvent.venue}</span>
                  </div>
                </div>
              </div>

              {/* University Partners */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">University Partners</h3>
                <div className="text-sm">
                  <p>{selectedEvent.partners || "No university partners specified"}</p>
                </div>
              </div>

              {/* List of Sustainable Development Goals */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">List of Sustainable Development Goals</h3>
                <div className="flex gap-2">
                  {selectedEvent.sdgs ? (
                    selectedEvent.sdgs.map((sdg, index) => (
                      <span key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {sdg}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No SDGs specified</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivitiesCalendar;