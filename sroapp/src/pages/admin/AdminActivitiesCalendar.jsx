import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

const AdminActivitiesCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [selectedMonth, setSelectedMonth] = useState(months[currentMonth.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentMonth.getFullYear().toString());

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

        // Transform the data to match our events structure
        const transformedEvents = data.map(activity => ({
          id: activity.activity_id,
          date: new Date(activity.schedule[0]?.start_date),
          title: activity.activity_name,
          time: `${activity.schedule[0]?.start_time} to ${activity.schedule[0]?.end_time}`,
          location: activity.venue,
          category: activity.activity_type,
          organization: activity.organization?.org_name,
          status: 'approved',
          description: activity.activity_description,
          partners: activity.university_partner,
          sdgs: activity.sdg_goals,
          venue: activity.venue
        }));

        setEvents(transformedEvents);
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

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  // Update month/year when dropdowns change
  const handleMonthChange = (value) => {
    if (typeof value === 'string') {
      // Handle dropdown change
      setSelectedMonth(value);
      const monthIndex = months.indexOf(value);
      const newDate = new Date(parseInt(selectedYear), monthIndex);
      setCurrentMonth(newDate);
    } else {
      // Handle calendar navigation
      setCurrentMonth(value);
      setSelectedMonth(months[value.getMonth()]);
      setSelectedYear(value.getFullYear().toString());
    }
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    const monthIndex = months.indexOf(selectedMonth);
    setCurrentMonth(new Date(parseInt(value), monthIndex));
  };

  // Print calendar
  const handlePrint = () => {
    window.print();
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

  // Get badge color for event category
  const getEventBadgeColor = (category) => {
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

  // Filter events based on selected organization
  const filteredEvents = selectedOrganization === "all" 
    ? events 
    : events.filter(event => event.organization === selectedOrganization);

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
          onClick={handlePrint}
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
              currentMonth={currentMonth}
              onDateSelect={handleEventClick}
              onMonthChange={handleMonthChange}
              monthOptions={months}
              yearOptions={years}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              events={filteredEvents}
              getEventColor={getEventColor}
            />
          )}
        </CardContent>
      </Card>      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title || 'Event Details'}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{selectedEvent.date instanceof Date ? selectedEvent.date.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                }) : ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p>{selectedEvent.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p>{selectedEvent.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p>{selectedEvent.organization}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                {selectedEvent.category && (
                  <Badge className={getEventBadgeColor(selectedEvent.category)}>
                    {selectedEvent.category}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p>{selectedEvent.description}</p>
              </div>
              {selectedEvent.partners && (
                <div>
                  <p className="text-sm text-gray-500">Partners</p>
                  <p>{selectedEvent.partners}</p>
                </div>
              )}
              {selectedEvent.sdgs && (
                <div>
                  <p className="text-sm text-gray-500">SDG Goals</p>
                  <p>{selectedEvent.sdgs}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminActivitiesCalendar;