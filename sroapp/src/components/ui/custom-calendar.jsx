import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { Badge } from "./badge";
import PropTypes from 'prop-types';

const CustomCalendar = ({
  mode = 'activities',
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
  onYearChange,
  confirmedDates = []
}) => {
  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const getAppointmentDayClass = (day) => {
    let classes = "flex items-center justify-center h-10 w-10 mx-auto relative rounded-full cursor-pointer ";
      if (selectedDate && isSameDay(day, selectedDate)) {
      classes += "bg-[#014421] text-white font-bold ";
    } 
    else if (isToday(day)) {
      classes += "border-2 border-[#014421] text-[#014421] font-bold ";    }    else if (isDateAvailable && isDateAvailable(day)) {
      if (datesWithAppointments.some(date => isSameDay(date, day))) {
        classes += "bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 ";
      } else {
        classes += "bg-[#014421]/20 text-[#014421] font-bold hover:bg-[#014421]/30 ";
      }
    } 
    else if (blockedDates.some(date => isSameDay(day, date))) {
      classes += "text-[#7B1113] font-bold ";
    } 
    else {
      classes += "text-gray-400 ";
    }
    
    return classes;
  };

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
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          {monthOptions && yearOptions ? (
            <div className="flex gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="p-2 border rounded-lg hover:border-[#014421] focus:outline-none focus:ring-2 focus:ring-[#014421] focus:border-transparent"
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
                className="p-2 border rounded-lg hover:border-[#014421] focus:outline-none focus:ring-2 focus:ring-[#014421] focus:border-transparent"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          ) : (            <h2 className="text-2xl font-bold text-[#7B1113]">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full bg-white text-[#014421] hover:bg-gray-100 border border-[#014421]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-full bg-white text-[#014421] hover:bg-gray-100 border border-[#014421]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className="text-sm font-medium text-[#014421] py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10"></div>
        ))}
        
        {generateCalendarDays().map((day, i) => (
          mode === 'appointments' ? (
            <div 
              key={i}
              onClick={() => onDateSelect && isDateAvailable && isDateAvailable(day) && onDateSelect(day)}
              className="p-1"
            >
              <div className={getAppointmentDayClass(day)}>
                {format(day, 'd')}
              </div>
            </div>
          ) : (
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
                  <Badge className="bg-[#7B1113] hover:bg-[#7B1113]/90 text-white border-0">
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