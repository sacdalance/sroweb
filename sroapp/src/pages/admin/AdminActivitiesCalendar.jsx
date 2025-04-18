import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ChevronLeft, ChevronRight, Printer, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

const AdminActivitiesCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3)); // April 2025
  const [viewMode, setViewMode] = useState("month"); // 'month' or 'day'
  const [selectedDay, setSelectedDay] = useState(new Date(2025, 3, 9)); // April 9, 2025
  const [filter, setFilter] = useState("all"); // 'all', 'approved', 'pending'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  
  // Month and year options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = ["2024", "2025", "2026", "2027", "2028"];
  const organizations = [
    "Computer Science Society",
    "UP Aguman",
    "Junior Blockchain Education Consortium of the Philippines",
    "Samahan ng Organisasyon UPB"
  ];
  
  // Selected values for dropdowns
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Days of the week
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Function to get the first day of the month (0-6 for Sunday-Saturday)
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Function to get the number of days in a month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Function to get the previous month's days that show on calendar
  const getPreviousMonthDays = (date) => {
    const firstDayOfMonth = getFirstDayOfMonth(date);
    const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1);
    const daysInPreviousMonth = getDaysInMonth(previousMonth);
    
    let days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        day: daysInPreviousMonth - firstDayOfMonth + i + 1,
        month: "previous",
        date: new Date(date.getFullYear(), date.getMonth() - 1, daysInPreviousMonth - firstDayOfMonth + i + 1)
      });
    }
    return days;
  };

  // Function to get the current month's days
  const getCurrentMonthDays = (date) => {
    const daysInMonth = getDaysInMonth(date);
    
    let days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: "current",
        date: new Date(date.getFullYear(), date.getMonth(), i)
      });
    }
    return days;
  };

  // Function to get the next month's days that show on calendar
  const getNextMonthDays = (date) => {
    const firstDayOfMonth = getFirstDayOfMonth(date);
    const daysInMonth = getDaysInMonth(date);
    const totalCells = 42; // 6 rows of 7 days
    const remainingCells = totalCells - (firstDayOfMonth + daysInMonth);
    
    let days = [];
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        month: "next",
        date: new Date(date.getFullYear(), date.getMonth() + 1, i)
      });
    }
    return days;
  };

  // Get all days to display on the calendar
  const getAllDays = () => {
    const previousMonthDays = getPreviousMonthDays(currentDate);
    const currentMonthDays = getCurrentMonthDays(currentDate);
    const nextMonthDays = getNextMonthDays(currentDate);
    
    return [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

    // Mock events data
    const events = [
      {
        id: 1,
        date: new Date(2025, 3, 9), // April 9, 2025
        title: "EVENT NAME",
        time: "8:00 AM to 5:00 PM",
        location: "Location",
        category: "Academic",
        organization: "Insert Mahabanog Org Name",
        status: "approved"
      },
    {
      id: 2,
      date: new Date(2025, 3, 9), // April 9, 2025
      title: "EVENT NAME",
      time: "3:00 PM to 5:00 PM",
      location: "Saeeum Cafe",
      category: "Cultural",
      organization: "Insert Mahabanog Org Name",
      status: "approved"
    },
    {
      id: 3,
      date: new Date(2025, 3, 10), // April 10, 2025
      title: "HACK BUDDIES",
      time: "1:00 PM to 5:00 PM",
      location: "Saeeum Cafe",
      category: "Educational",
      organization: "Junior Blockchain Education Consortium of the Philippines",
      status: "approved"
    },
    {
      id: 4,
      date: new Date(2025, 3, 17), // April 17, 2025
      title: "EVENT NAME",
      time: "1:00 PM to 5:00 PM",
      location: "Location",
      category: "Sports",
      organization: "Insert Mahabanog Org Name",
      status: "pending"
    }
  ];

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const dateMatch = event.date.getDate() === date.getDate() && 
                       event.date.getMonth() === date.getMonth() && 
                       event.date.getFullYear() === date.getFullYear();
      
      const statusMatch = filter === "all" || event.status === filter;
      const orgMatch = selectedOrganization === "all" || event.organization === selectedOrganization;
      
      return dateMatch && statusMatch && orgMatch;
    });
  };

  // Check if a date has events
  const hasEvents = (date) => {
    return getEventsForDate(date).length > 0;
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(newDate);
    setSelectedMonth(months[newDate.getMonth()]);
    setSelectedYear(newDate.getFullYear().toString());
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(newDate);
    setSelectedMonth(months[newDate.getMonth()]);
    setSelectedYear(newDate.getFullYear().toString());
  };

  // Select a day to view
  const selectDay = (date) => {
    setSelectedDay(date);
    setViewMode("day");
  };

  // Format date for display
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Format date for daily view
  const formatDayMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

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

  // Mock print calendar function
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

  // Create the calendar grid
  const generateCalendar = () => {
    const allDays = getAllDays();
    const calendar = [];
    const weeks = Math.ceil(allDays.length / 7);
    
    for (let i = 0; i < weeks; i++) {
      const week = allDays.slice(i * 7, (i + 1) * 7).map(day => {
        const isToday = new Date().toDateString() === day.date.toDateString();
        const isCurrentMonth = day.month === "current";
        
        return {
          date: day.day,
          isToday,
          isCurrentMonth,
          events: getEventsForDate(day.date),
          fullDate: day.date
        };
      });
      calendar.push(week);
    }
    
    return calendar;
  };

  const calendar = generateCalendar();

  // Mock upcoming events data
  const upcomingEvents = [
    {
      id: 1,
      date: "April 9, 2025",
      title: "EVENT NAME",
      organization: "Insert Mahabanog Org Name",
      type: "Academic",
      venue: "Location"
    },
    {
      id: 2,
      date: "April 10, 2025",
      title: "HACK BUDDIES",
      organization: "Junior Blockchain Education Consortium of the Philippines",
      type: "Educational",
      venue: "Saeeum Cafe"
    },
    {
      id: 3,
      date: "April 17, 2025",
      title: "EVENT NAME",
      organization: "Insert Mahabanog Org Name",
      type: "Sports",
      venue: "Location"
    }
  ];

  // Update the handleViewEventDetails function
  const handleViewEventDetails = (event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

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
        <CardHeader className="py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-[#7B1113]">
              {selectedMonth} {selectedYear}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handlePreviousMonth}
                className="p-2 rounded-full bg-white text-[#014421] hover:bg-gray-100 border border-[#014421]"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNextMonth}
                className="p-2 rounded-full bg-white text-[#014421] hover:bg-gray-100 border border-[#014421]"
                size="icon"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 text-sm font-medium text-center bg-gray-50 border-b border-gray-200">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
              (day) => (
                <div key={day} className="py-3 border-r last:border-r-0 border-gray-200 text-[#014421]">
                  {day}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7 text-sm">
            {calendar.map((week, weekIndex) =>
              week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`min-h-[120px] p-1 border-r border-b last:border-r-0 ${
                    day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                  } ${day.isToday ? "border-2 border-[#014421]" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-medium p-1 rounded-full w-6 h-6 flex items-center justify-center ${
                      day.isToday ? "bg-[#014421] text-white" : ""
                    }`}>
                      {day.date}
                    </span>
                    {day.events.length > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="bg-[#7B1113] text-white border-transparent hover:bg-[#7B1113]/90"
                      >
                        {day.events.length}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                    {day.events.map((event, index) => (
                      <div
                        key={index}
                        className={`px-1 py-0.5 text-xs rounded truncate ${
                          getEventColor(event.category)
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
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
        <CardHeader className="bg-[#7B1113]/10 py-4">
          <CardTitle className="text-xl font-bold text-[#7B1113]">
            Upcoming Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Date</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Activity</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Organization</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Type</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Venue</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Actions</th>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventBadgeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {event.venue}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <Button
                        onClick={() => handleViewEventDetails(event)}
                        className="px-3 py-1 rounded-md bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add the Dialog component */}
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

              {/* Schedule */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">Schedule</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Date:</span>
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Time:</span>
                    <span>{selectedEvent.time}</span>
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

              {/* Bottom Section with Status and View Form Button */}
              <div className="flex justify-between items-center">
                <Button 
                  className="text-sm bg-[#014421] hover:bg-[#013319] text-white"
                >
                  View Scanned Form
                </Button>
                <Badge 
                  variant={selectedEvent.status === 'approved' ? 'success' : 'warning'}
                  className="text-sm px-4 py-1"
                >
                  {selectedEvent.status ? selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1) : 'Unknown'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminActivitiesCalendar; 