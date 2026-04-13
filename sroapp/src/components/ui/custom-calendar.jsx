import { ChevronLeft, ChevronRight, Repeat2 } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, addDays, isWeekend } from "date-fns";
import { Badge } from "./badge";
import PropTypes from 'prop-types';
import { dotColorMap } from "@/lib/activityTypes";

const CustomCalendar = ({
  mode = 'activities',
  currentMonth,
  selectedDate,
  onDateSelect,
  onMonthChange,
  events = [],
  blockedDates = [],
  highlightedDates = [], // New prop for pending selections
  dimWeekends = false,   // New prop to dim weekends
  datesWithAppointments = [],
  isDateAvailable,
  getEventColor,
  monthOptions,
  yearOptions,
  selectedMonth,
  selectedYear,
  onYearChange,
  confirmedDates = []
}) => {
  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));

  const generateCalendarDays = () => {
    // Fixed 6-row calendar (42 days) to ensure consistent height
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart); // Default starts on Sunday
    const endDate = addDays(startDate, 41); // 42 days total

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const getAppointmentDayClass = (day) => {
    let classes = "flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 mx-auto relative rounded-full cursor-pointer text-sm sm:text-base transition-all duration-200 ";
    const isWknd = isWeekend(day);

    if (selectedDate && isSameDay(day, selectedDate)) {
      classes += "bg-sro-secondary text-white font-bold ";
    }
    else if (isToday(day)) {
      classes += "border-2 border-sro-secondary text-sro-secondary font-bold ";
    }
    // Highlighted (Pending Selection) - Prioritize over available but under blocked if needed, or parallel
    else if (highlightedDates.some(date => isSameDay(date, day))) {
      classes += "bg-sro-primary/20 text-sro-primary font-bold ring-2 ring-sro-primary ring-inset ";
    }
    else if (blockedDates.some(date => isSameDay(day, date))) {
      classes += "bg-red-100 text-sro-primary font-bold ";
    }
    else if (isDateAvailable && isDateAvailable(day)) {
      if (datesWithAppointments.some(date => isSameDay(date, day))) {
        classes += "bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 ";
      } else {
        // Normal available day
        if (dimWeekends && isWknd) {
          classes += "text-gray-300 bg-gray-50/50 cursor-not-allowed ";
        } else {
          classes += "text-gray-700 hover:bg-gray-100 ";
        }
      }
    }
    else {
      classes += "text-gray-400 ";
    }

    return classes;
  };

  const getActivityDayClass = (day) => {
    const dayEvents = events.filter(event => isSameDay(new Date(event.date), day));
    let classes = "min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 relative cursor-pointer hover:bg-gray-50 transition-colors ";

    if (!isSameMonth(day, currentMonth)) {
      classes += "bg-gray-50/50 text-gray-400 "; // Lighter background for non-month days
    } else {
      classes += "bg-white ";
    }

    if (selectedDate && isSameDay(day, selectedDate)) {
      classes += "ring-2 ring-inset ring-sro-primary ";
    } else if (isToday(day)) {
      classes += "border-2 border-sro-secondary ";
    }

    return {
      containerClass: classes,
      hasEvents: dayEvents.length > 0,
      events: dayEvents
    };
  };

  const getDotColor = (category) => dotColorMap[category] || "bg-gray-400";

  return (
    <div className="p-2 sm:p-4 bg-white rounded-lg shadow">
      {/* Header controls remain same */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          {monthOptions && yearOptions ? (
            <div className="flex gap-2 sm:gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="p-1 sm:p-2 text-sm sm:text-base border rounded-lg hover:border-sro-secondary focus:outline-none focus:ring-2 focus:ring-sro-secondary focus:border-transparent max-w-[120px] sm:max-w-none"
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
                className="p-1 sm:p-2 text-sm sm:text-base border rounded-lg hover:border-sro-secondary focus:outline-none focus:ring-2 focus:ring-sro-secondary focus:border-transparent"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          ) : (<h2 className="text-base sm:text-2xl font-bold text-sro-primary">
            {format(currentMonth, 'MMMM').toUpperCase()} {format(currentMonth, 'yyyy')}
          </h2>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 rounded-full bg-white text-sro-secondary hover:bg-gray-100 border border-sro-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 rounded-full bg-white text-sro-secondary hover:bg-gray-100 border border-sro-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className="text-[10px] sm:text-sm font-medium text-sro-secondary py-2 text-center">
            <span className="md:hidden">{day.charAt(0)}</span>
            <span className="hidden md:block">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px sm:gap-1 bg-gray-200 sm:bg-transparent border border-gray-200 sm:border-none rounded overflow-hidden sm:overflow-visible">
        {/* No need for empty start days filler because we start at startOfWeek now */}

        {generateCalendarDays().map((day, i) => (
          mode === 'appointments' ? (
            // Keep appointments logic if needed, but it seems we focus on 'activities'
            // If appointments mode needs fixed grid too, we should apply styling. 
            // Assuming appointments mode uses simple day cells.
            <div
              key={i}
              onClick={() => {
                // If dimWeekends is on and it is weekend, do nothing unless we want to allow selecting weekends explicitly?
                // User said "naturally unavailable", implies unclickable for booking.
                // But for blocking settings, maybe we want to unblock? 
                // Assuming for "BlockedDatesSettings", we might want to click ANYTHING.
                // But "isDateAvailable" prop usually controls clickability.
                // Let's rely on isDateAvailable passed from parent.
                if (onDateSelect && (!isDateAvailable || isDateAvailable(day))) {
                  onDateSelect(day);
                }
              }}
              className="p-1 bg-white sm:bg-transparent h-[40px] sm:h-auto flex items-center justify-center cursor-pointer select-none"
            >
              {/* Show day if in current month or if we want to show prev/next month days faded */}
              <div className={`${getAppointmentDayClass(day)} ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ) : (
            <div
              key={i}
              className={`${getActivityDayClass(day).containerClass} h-full flex flex-col`}
              onClick={() => onDateSelect && onDateSelect(day)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-medium text-xs sm:text-base p-1 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${isToday(day) ? "bg-sro-secondary text-white" :
                  (selectedDate && isSameDay(day, selectedDate)) ? "bg-sro-primary text-white" : ""
                  }`}>
                  {format(day, 'd')}
                </span>

                {getActivityDayClass(day).hasEvents && (
                  <Badge className="hidden sm:inline-flex bg-sro-primary hover:bg-sro-primary/90 text-white border-0 px-1 py-0 h-4 min-w-[16px] justify-center text-[10px]">
                    {getActivityDayClass(day).events.length}
                  </Badge>
                )}
              </div>

              {getActivityDayClass(day).hasEvents && (
                <>
                  <div className="hidden sm:block mt-1 space-y-1 overflow-hidden">
                    {getActivityDayClass(day).events.slice(0, 2).map((event, index) => (
                      <div
                        key={index}
                        className={`px-1 py-0.5 text-[10px] sm:text-xs rounded cursor-pointer flex items-center gap-0.5 ${getEventColor(event.category, event)} ${event.isRecurringInstance ? 'border-l-2 border-dashed border-current opacity-80' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateSelect && onDateSelect(day);
                        }}
                        title={event.title}
                      >
                        {event.isRecurringInstance && <Repeat2 className="w-2.5 h-2.5 flex-shrink-0" />}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {getActivityDayClass(day).events.length > 2 && (
                      <div
                        className="text-[10px] sm:text-[11px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0.5 rounded-md cursor-pointer hover:bg-gray-200 hover:text-gray-800 transition-colors inline-block mt-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateSelect && onDateSelect(day);
                        }}
                      >
                        + {getActivityDayClass(day).events.length - 2} more
                      </div>
                    )}
                  </div>

                  <div className="sm:hidden flex flex-wrap gap-1 mt-auto justify-center pb-1">
                    {getActivityDayClass(day).events.slice(0, 4).map((event, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${getDotColor(event.category)} ${event.isRecurringInstance ? 'ring-1 ring-offset-1 ring-current' : ''}`}
                      />
                    ))}
                    {getActivityDayClass(day).events.length > 4 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    )}
                  </div>
                </>
              )}
            </div>
          )
        ))}
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
  highlightedDates: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  dimWeekends: PropTypes.bool,
  datesWithAppointments: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  confirmedDates: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  isDateAvailable: PropTypes.func,
  getEventColor: PropTypes.func,
  monthOptions: PropTypes.arrayOf(PropTypes.string),
  yearOptions: PropTypes.arrayOf(PropTypes.string),
  selectedMonth: PropTypes.string,
  selectedYear: PropTypes.string,
  onYearChange: PropTypes.func
};

export default CustomCalendar;