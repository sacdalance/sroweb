import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, X, Info, LayoutGrid, Table } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CustomCalendar from "@/components/ui/custom-calendar";
import DataTable from "@/components/ui/DataTable";
import PropTypes from 'prop-types';
import { Dialog } from "@/components/ui/dialog";
import { isSameDay, format } from "date-fns";

// Activity type color mapping
const activityTypeColors = {
  charitable: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  serviceWithinUPB: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  serviceOutsideUPB: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
  contestWithinUPB: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  contestOutsideUPB: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  educational: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  incomeGenerating: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  massOrientation: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300" },
  booth: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  rehearsals: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  specialEvents: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
  others: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
};

// Category map for activity types
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

// Type options for multi-select
const typeOptions = Object.keys(categoryMap).map(key => ({
  value: key,
  label: categoryMap[key]
}));

const UnifiedActivitiesCalendar = ({
  dialogComponent: DialogComponent,
  fetchDialogActivity,
  userRole = null,
  calendarTitle = "Activities Calendar",
  showLegend = true,
  showUpcoming = true,
  ...customProps
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [hideRecurring, setHideRecurring] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? "card" : "table";
    }
    return "table";
  });

  // Month and year options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = ["2024", "2025", "2026", "2027", "2028"];
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Fetch organizations
  useEffect(() => {
    if (customProps.fetchOrganizations) {
      customProps.fetchOrganizations().then(orgs => setOrganizations(orgs));
    }
  }, [customProps.fetchOrganizations]);

  // Fetch activities
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await customProps.fetchActivities();
        let calendarEvents = [];
        data.forEach(activity => {
          const schedule = activity.schedule[0];
          if (schedule?.is_recurring && schedule.recurring_days) {
            const recurringDays = typeof schedule.recurring_days === 'string' ? JSON.parse(schedule.recurring_days) : schedule.recurring_days;
            const start = new Date(schedule.start_date);
            const end = new Date(schedule.end_date);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
              if (recurringDays[dayName]) {
                calendarEvents.push({
                  id: `${activity.activity_id}-${d.toISOString().split('T')[0]}`,
                  originalId: activity.activity_id,
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
            calendarEvents.push({
              id: activity.activity_id,
              originalId: activity.activity_id,
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
        setEvents(calendarEvents);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transformedEvents = calendarEvents.map(event => {
          const eventDate = event.date;
          const diffTime = eventDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let timeframe = "Upcoming";
          let relativeDate = "";
          let isUpcoming = false;

          if (diffDays >= 0 && diffDays <= 30) {
            isUpcoming = true;
            if (diffDays === 0) { timeframe = "Today"; relativeDate = "Today"; }
            else if (diffDays === 1) { timeframe = "Tomorrow"; relativeDate = "Tomorrow"; }
            else if (diffDays <= 7) { timeframe = "This Week"; relativeDate = `In ${diffDays} days`; }
            else if (diffDays <= 14) { timeframe = "Next Week"; relativeDate = `In ${diffDays} days`; }
            else {
              timeframe = "Later";
              relativeDate = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            }
          } else if (diffDays < 0) {
            timeframe = "Past";
          } else {
            timeframe = "Future";
          }

          return {
            ...event,
            timeframe,
            relativeDate,
            absoluteDate: eventDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            startDate: eventDate,
            isUpcoming
          };
        }).sort((a, b) => a.date - b.date);

        setUpcomingEvents(transformedEvents);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [customProps.fetchActivities, selectedOrganization]);

  const handleMonthChange = (value) => {
    const monthIndex = months.indexOf(value);
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setSelectedMonth(value);
  };

  const handleYearChange = (value) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(value));
    setCurrentDate(newDate);
    setSelectedYear(value);
  };

  useEffect(() => {
    const month = currentDate.toLocaleString("default", { month: "long" });
    const year = currentDate.getFullYear().toString();
    if (selectedMonth !== month) setSelectedMonth(month);
    if (selectedYear !== year) setSelectedYear(year);
  }, [currentDate]);

  const getEventColor = (category, event) => {
    if (event?.isRecurringInstance) return 'bg-orange-200 text-orange-800';
    return 'bg-red-100 text-sro-primary';
  };

  const handleDateSelect = (dateOrEvent) => {
    const date = dateOrEvent instanceof Date ? dateOrEvent : (dateOrEvent.date ? new Date(dateOrEvent.date) : null);
    if (date) {
      if (selectedDateFilter && isSameDay(date, selectedDateFilter)) {
        setSelectedDateFilter(null);
      } else {
        setSelectedDateFilter(date);
      }
    }
  };

  const clearDateFilter = () => setSelectedDateFilter(null);

  const handleEventClick = async (event) => {
    setModalLoading(true);
    setIsDialogOpen(true);
    setSelectedEvent(null);
    const baseId = event.originalId || event.id;
    try {
      const activity = await fetchDialogActivity(baseId);
      setSelectedEvent(activity);
    } catch (err) {
      setSelectedEvent(event);
    }
    setModalLoading(false);
  };

  const LoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner text="Loading activities..." variant="section" />
    </div>
  );

  const ErrorState = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-8 text-sro-primary">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="text-sm text-gray-600">{message}</p>
      <Button onClick={() => window.location.reload()} className="mt-4 bg-sro-primary hover:bg-sro-primary/90 text-white">
        Try Again
      </Button>
    </div>
  );

  ErrorState.propTypes = { message: PropTypes.string.isRequired };

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <CalendarDays className="h-12 w-12 mb-3 text-gray-300" />
      <p className="text-lg font-semibold">No activities found</p>
      <p className="text-sm">{message || "There are no approved activities to display."}</p>
    </div>
  );

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const [startTime, endTime] = timeString.split(' to ').map(time => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      if (hour === 12) return `${hour}:${minutes}NN`;
      return hour > 12 ? `${hour - 12}:${minutes}PM` : `${hour}:${minutes}AM`;
    });
    return `${startTime} to ${endTime}`;
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (selectedOrganization !== "all" && event.organization !== selectedOrganization) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(event.category)) return false;
      if (hideRecurring && event.isRecurringInstance) return false;
      return true;
    });
  }, [events, selectedOrganization, selectedTypes, hideRecurring]);

  const filteredListEvents = useMemo(() => {
    return upcomingEvents.filter(event => {
      if (selectedOrganization !== "all" && event.organization !== selectedOrganization) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(event.category)) return false;
      if (hideRecurring && event.isRecurringInstance) return false;
      if (selectedDateFilter) {
        return new Date(event.startDate).toDateString() === new Date(selectedDateFilter).toDateString();
      } else {
        // Filter by selected Month and Year from dropdowns to sync with Calendar
        const eventDate = new Date(event.startDate);
        const eventMonth = eventDate.toLocaleString('default', { month: 'long' });
        const eventYear = eventDate.getFullYear().toString();
        return eventMonth === selectedMonth && eventYear === selectedYear;
      }
    });
  }, [upcomingEvents, selectedOrganization, selectedTypes, selectedDateFilter, hideRecurring, selectedMonth, selectedYear]);

  const activityCount = filteredListEvents.length;

  const upcomingColumns = useMemo(() => [
    {
      key: "when",
      header: "When",
      width: "w-[18%]",
      sortable: true,
      sortAccessor: (row) => row.startDate,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sro-primary text-sm">
            {selectedDateFilter ? (isSameDay(row.startDate, new Date()) ? "Today" : "") :
              (row.relativeDate === "Today" || row.relativeDate === "Tomorrow"
                ? `${row.relativeDate}, ${row.absoluteDate.split(',')[0].split(' ')[0]} ${row.absoluteDate.split(',')[0].split(' ')[1]}`
                : row.absoluteDate.split(',')[0])
            }
          </span>
          <span className="text-gray-500 text-xs mt-0.5">{formatTime(row.time)}</span>
        </div>
      ),
    },
    {
      key: "title",
      header: "Activity",
      width: "w-[25%]",
      sortable: true,
      render: (row) => (
        <span className="break-words whitespace-normal md:truncate block text-gray-700 font-medium" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: "organization",
      header: "Organization",
      width: "w-[22%]",
      sortable: true,
      render: (row) => (
        <span className="break-words whitespace-normal md:truncate block text-gray-600" title={row.organization}>
          {row.organization}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "w-[18%]",
      sortable: true,
      render: (row) => (
        <span style={{
          backgroundColor: activityTypeColors[row.category]?.bg.replace('bg-', '') || '#f3f4f6',
        }} className={`inline-block px-2 py-1 rounded-full text-xs font-medium truncate max-w-full ${activityTypeColors[row.category]?.bg || 'bg-gray-100'} ${activityTypeColors[row.category]?.text || 'text-gray-700'}`}>
          {categoryMap[row.category] || row.category}
        </span>
      ),
    },
    {
      key: "venue",
      header: "Venue",
      width: "w-[17%]",
      render: (row) => (
        <span className="truncate block text-gray-600" title={row.venue}>
          {row.venue}
        </span>
      ),
    },
  ], [selectedDateFilter]);

  return (
    <div className="container mx-auto p-2 sm:p-6 max-w-[1600px]">
      <div className="flex items-center gap-2 mb-4">
        <h1 className={`page-header ${window.location.pathname.includes('/admin') ? 'text-sro-primary' : 'text-black'} mb-0`}>{calendarTitle}</h1>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-3 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full items-center sm:items-start">
          <UnifiedDropdown
            options={months}
            value={selectedMonth}
            onChange={handleMonthChange}
            placeholder="Select month"
            className="w-full sm:w-40"
          />
          <UnifiedDropdown
            options={years}
            value={selectedYear}
            onChange={handleYearChange}
            placeholder="Select year"
            className="w-full sm:w-28"
          />
          <UnifiedDropdown
            options={[{ value: "all", label: "All Organizations" }, ...organizations.map(org => ({ value: org, label: org }))]}
            value={selectedOrganization}
            onChange={setSelectedOrganization}
            placeholder="Select organization"
            searchable
            searchPlaceholder="Search organization..."
            className="w-full sm:w-56"
          />
          <MultiSelectDropdown
            options={typeOptions}
            selected={selectedTypes}
            onChange={setSelectedTypes}
            placeholder="Filter by Type..."
            className="w-full sm:w-56"
          />
          <div className="flex items-center">
            <label
              htmlFor="hideRecurring"
              className="flex items-center gap-2 h-10 px-3 border rounded-md bg-white cursor-pointer hover:bg-gray-50 transition-colors select-none"
            >
              <Checkbox
                id="hideRecurring"
                checked={hideRecurring}
                onCheckedChange={setHideRecurring}
              />
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">
                Hide Recurring
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-lg shadow-md border border-gray-200 bg-white">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <CustomCalendar
            mode="activities"
            currentMonth={currentDate}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDateFilter}
            onMonthChange={setCurrentDate}
            events={filteredEvents}
            getEventColor={(category, event) => getEventColor(category, event)}
          />
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 mb-4 sm:mb-6 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-sro-primary"></span>
            <span className="text-xs font-medium text-gray-600">Non-recurring Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-200 border border-orange-800"></span>
            <span className="text-xs font-medium text-gray-600">Recurring Event</span>
          </div>
        </div>
      )}

      {/* List Section */}
      {showUpcoming && (
        <Card className="rounded-lg shadow-md mt-4 sm:mt-6 transition-all duration-300">
          <CardHeader className="bg-white p-3 sm:px-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <CardTitle className="text-base sm:text-xl font-bold text-sro-primary flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                {selectedDateFilter ? (
                  <>
                    Events on <span className="text-sro-secondary font-bold">{format(selectedDateFilter, 'MMMM d, yyyy')}</span>
                  </>
                ) : `${selectedMonth} ${selectedYear}`}
              </CardTitle>

              {/* Info Popover - Mobile Friendly Click Trigger */}
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-pointer hover:text-sro-primary transition-colors flex-shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 text-xs">
                  <p>Select days to see all events in that day</p>
                </PopoverContent>
              </Popover>
            </div>

            {/* Right Side: Filters/Clear */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="inline-flex rounded-md shadow-sm border bg-white p-1 h-9 sm:h-10 items-center">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 sm:px-4 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors h-full ${viewMode === "table"
                    ? "bg-gray-100 text-sro-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  title="Table View"
                >
                  <Table className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`px-3 sm:px-4 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors h-full ${viewMode === "card"
                    ? "bg-gray-100 text-sro-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  title="Card View"
                >
                  <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>

              {selectedDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="text-gray-500 hover:text-sro-primary hover:bg-gray-100 h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-0 pb-4">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : filteredListEvents.length === 0 ? (
              <EmptyState message={selectedDateFilter ? "No events scheduled for this day." : "No upcoming activities found."} />
            ) : (
              <DataTable
                columns={upcomingColumns}
                data={filteredListEvents}
                onRowClick={handleEventClick}
                emptyMessage="No activities match your filters."
                defaultPageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                className="upcoming-activities-table border-0 shadow-none -mt-px"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                hideViewToggle={true}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {modalLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <LoadingSpinner text="Loading details..." variant="section" />
          </div>
        ) : (
          selectedEvent && (
            <DialogComponent
              activity={selectedEvent}
              isModalOpen={isDialogOpen}
              showAddToCalendar={true}
            />
          )
        )}
      </Dialog>
    </div>
  );
};

export default UnifiedActivitiesCalendar;