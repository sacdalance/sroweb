import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { Badge } from "./badge";
import PropTypes from 'prop-types';

const CustomCalendar = ({
  mode = 'activities', // 'activities' or 'appointments'
  currentMonth,
  selectedDate,
  onDateSelect,
  onMonthChange,
  events = [],
  blockedDates = [],
  datesWithAppointments = [],
  isDateAvailable,
  getEventColor,
  monthOptions,
  yearOptions,
  selectedMonth,
  selectedYear,
  onYearChange
}) => {
  // Handle previous month navigation
  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  // Handle next month navigation
  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return dateRange;
  };

  // Get day cell class for appointments mode
  const getAppointmentDayClass = (day) => {
    let classes = "flex items-center justify-center rounded-full h-10 w-10 mx-auto ";
    
    // Check if this date has appointments
    const hasAppointments = datesWithAppointments.some(appointmentDate => 
      isSameDay(day, appointmentDate)
    );
    
    // First handle selected date
    if (selectedDate && isSameDay(day, selectedDate)) {
      classes += "bg-[#007749] text-white font-bold ";
    } 
    // Handle today
    else if (isToday(day)) {
      classes += "border-2 border-[#007749] text-[#007749] font-bold ";
    } 
    // Handle available dates
    else if (isDateAvailable && isDateAvailable(day)) {
      if (hasAppointments) {
        classes += "text-blue-800 font-bold hover:text-blue-900 cursor-pointer ";
      } else {
        classes += "text-[#007749] font-bold hover:text-[#005a37] cursor-pointer ";
      }
    } 
    // Handle blocked dates
    else if (blockedDates.some(blockedDate => isSameDay(day, blockedDate))) {
      classes += "text-[#7B1113] font-bold ";
    } 
    // Handle unavailable dates
    else {
      classes += "text-gray-600 ";
    }
    
    return classes;
  };

  // Get day cell class for activities mode
  const getActivityDayClass = (day) => {
    const dayEvents = events.filter(event => isSameDay(new Date(event.date), day));
    let classes = "min-h-[100px] p-2 relative ";
    
    if (!isSameMonth(day, currentMonth)) {
      classes += "bg-gray-50 text-gray-400 ";
    } else {
      classes += "bg-white ";
    }
    
    if (isToday(day)) {
      classes += "border-2 border-[#014421] ";
    }
    
    return {
      containerClass: classes,
      hasEvents: dayEvents.length > 0,
      events: dayEvents
    };
  };

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="mb-4 flex items-center justify-between">
        <button 
          onClick={handlePrevMonth}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex gap-4">
          {monthOptions && yearOptions ? (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="p-1 border rounded"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="p-1 border rounded"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <h2 className="font-bold text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          )}
        </div>

        <button 
          onClick={handleNextMonth}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="w-full">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2 text-center">
          <div className="text-sm font-semibold">SUN</div>
          <div className="text-sm font-semibold">MON</div>
          <div className="text-sm font-semibold">TUE</div>
          <div className="text-sm font-semibold">WED</div>
          <div className="text-sm font-semibold">THU</div>
          <div className="text-sm font-semibold">FRI</div>
          <div className="text-sm font-semibold">SAT</div>
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 border rounded-lg bg-gray-100">
          {/* Fill in empty slots for the first week */}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10"></div>
          ))}
          
          {/* Actual days */}
          {generateCalendarDays().map((day, i) => (
            mode === 'appointments' ? (
              // Appointment booking mode
              <div 
                key={i}
                onClick={() => onDateSelect && onDateSelect(day)}
                className="p-1 hover:bg-gray-50 cursor-pointer"
              >
                <div className={getAppointmentDayClass(day)}>
                  {format(day, 'd')}
                </div>
              </div>
            ) : (
              // Activities display mode
              <div 
                key={i}
                className={getActivityDayClass(day).containerClass}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-medium p-1 rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday(day) ? "bg-[#014421] text-white" : ""
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {getActivityDayClass(day).hasEvents && (
                    <Badge 
                      variant="destructive" 
                      className="bg-[#7B1113] text-white border-transparent hover:bg-[#7B1113]/90"
                    >
                      {getActivityDayClass(day).events.length}
                    </Badge>
                  )}
                </div>
                {getActivityDayClass(day).hasEvents && (
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px]">
                    {getActivityDayClass(day).events.map((event, index) => (
                      <div
                        key={index}
                        className={`px-1 py-0.5 text-xs rounded truncate cursor-pointer ${getEventColor(event.category)}`}
                        onClick={() => onDateSelect && onDateSelect(event)}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

CustomCalendar.propTypes = {
  mode: PropTypes.oneOf(['activities', 'appointments']),
  currentMonth: PropTypes.instanceOf(Date).isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  onDateSelect: PropTypes.func,
  onMonthChange: PropTypes.func.isRequired,
  events: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    title: PropTypes.string,
    category: PropTypes.string
  })),
  blockedDates: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  datesWithAppointments: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  isDateAvailable: PropTypes.func,
  getEventColor: PropTypes.func,
  monthOptions: PropTypes.arrayOf(PropTypes.string),
  yearOptions: PropTypes.arrayOf(PropTypes.string),
  selectedMonth: PropTypes.string,
  selectedYear: PropTypes.string,
  onYearChange: PropTypes.func
};

export default CustomCalendar;