import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";
import PropTypes from 'prop-types';

/**
 * Unified Weekly Calendar Component
 * Used by both Dashboard and AdminPanel for consistent calendar display
 */
const WeeklyCalendar = ({
    events = [],
    loading = false,
    onEventClick,
    calendarLink = "/activities-calendar",
    onMoreActivitiesClick,
}) => {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

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

    // Get events for a specific day
    const getEventsForDay = (date) => {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        return events.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === normalizedDate.getTime();
        });
    };

    // Handle more activities click
    const handleMoreClick = (e, dayEvents) => {
        e.stopPropagation();
        if (onMoreActivitiesClick) {
            onMoreActivitiesClick(dayEvents[0].date);
        }
    };

    // Render activity card
    const renderActivityCard = (dayEvents, isMobile = false) => {
        const event = dayEvents[0];
        const isRecurring = event.is_recurring === "true";

        return (
            <div
                key={event.id}
                onClick={() => onEventClick && onEventClick(event)}
                className={`bg-white rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] w-full max-w-full mx-auto relative cursor-pointer hover:bg-gray-50 transition-all border border-gray-200 shadow-sm ${isRecurring ? "border-l-[6px] border-l-sro-accent" : "border-l-[6px] border-l-sro-primary"
                    }`}
            >
                {/* Activity Name and Time */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-gray-900 font-bold text-sm truncate flex-1" title={event.name}>{event.name}</h3>
                    <span className="text-gray-500 text-[10px] sm:text-xs flex-shrink-0 font-medium">{event.time}</span>
                </div>
                {/* Organization Name */}
                <span className="text-sro-primary text-xs font-semibold truncate mb-auto" title={event.organization}>{event.organization}</span>

                {/* Bottom Row: Location and Activity Count */}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                    {isRecurring ? (
                        <div className="flex flex-col min-w-0">
                            <span className="text-gray-500 text-[10px] truncate">
                                {(() => {
                                    const sched = event.schedule?.[0] || {};
                                    const recurringDays = sched.recurring_days ? JSON.parse(sched.recurring_days) : {};
                                    const daysList = Object.keys(recurringDays).filter(day => recurringDays[day]).map(d => d.slice(0, 3));
                                    return daysList.length > 0 ? daysList.join(", ") : "Recurring";
                                })()}
                            </span>
                        </div>
                    ) : (
                        <span className="text-gray-500 text-[11px] truncate" title={event.location}>{event.location}</span>
                    )}

                    {dayEvents.length > 1 && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto whitespace-nowrap border border-gray-200">
                            +{dayEvents.length - 1} more
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Render empty day
    const renderEmptyDay = () => (
        <div className="rounded-lg overflow-hidden border border-gray-200 h-[100px] w-full max-w-full mx-auto flex items-center justify-center">
            <span className="text-gray-500 text-sm truncate">No Activities</span>
        </div>
    );

    // Render day label
    const renderDayLabel = (date, day, isToday, isMobile = false) => (
        <div
            className={`flex flex-col items-center justify-center rounded-lg w-16 h-[100px] ${isMobile ? 'flex-shrink-0' : ''}
        ${isToday ? "bg-sro-accent text-sro-primary font-bold border-2 border-sro-accent shadow" : ""}
      `}
        >
            <span className="text-xs">{day}</span>
            <span className="text-base">{date.getDate()}</span>
        </div>
    );

    return (
        <Card className="shadow-sm flex flex-col h-full">
            <CardHeader className="pb-3 px-4">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <CardTitle className="text-xl font-bold text-sro-primary">Activities Calendar</CardTitle>
                        <span className="text-sm font-medium text-black mt-1">
                            {getWeekRange(currentWeekStart)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleWeekNavigation("prev")}
                            className="p-1.5 rounded-full bg-white text-sro-secondary hover:bg-gray-100 border border-sro-secondary"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleWeekNavigation("next")}
                            className="p-1.5 rounded-full bg-white text-sro-secondary hover:bg-gray-100 border border-sro-secondary"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow min-w-0">
                {loading ? (
                    <LoadingSpinner text="Loading Calendar..." variant="section" />
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
                                        <div key={i}>
                                            {renderDayLabel(date, day, isToday)}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Activity cards in vertical stack */}
                            <div className="flex flex-col gap-2 h-full min-w-0">
                                {Array.from({ length: 7 }, (_, i) => {
                                    const date = new Date(currentWeekStart);
                                    date.setDate(date.getDate() - date.getDay() + i);
                                    const dayEvents = getEventsForDay(date);

                                    return (
                                        <div key={i} className="flex-1 min-w-0">
                                            {dayEvents.length > 0 ? renderActivityCard(dayEvents) : renderEmptyDay()}
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
                                const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i];
                                const isToday = new Date().toDateString() === date.toDateString();
                                const dayEvents = getEventsForDay(date);

                                return (
                                    <div key={i} className="flex flex-row items-center gap-2 w-full">
                                        {renderDayLabel(date, day, isToday, true)}
                                        <div className="flex flex-row flex-wrap gap-2 w-full min-w-0">
                                            {dayEvents.length > 0 ? (
                                                dayEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        onClick={() => onEventClick && onEventClick(event)}
                                                        className={`bg-white rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] flex-1 basis-[220px] max-w-full justify-between cursor-pointer hover:bg-gray-50 transition-all border border-gray-200 shadow-sm ${event.is_recurring === "true" ? "border-l-[6px] border-l-sro-accent" : "border-l-[6px] border-l-sro-primary"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1 gap-2">
                                                            <h3 className="text-gray-900 font-bold text-sm truncate flex-1">{event.name}</h3>
                                                            <span className="text-gray-500 text-[10px] flex-shrink-0 font-medium">{event.time}</span>
                                                        </div>

                                                        <span className="text-sro-primary text-xs font-semibold truncate mb-auto">{event.organization}</span>

                                                        <div className="flex flex-row items-center justify-between gap-2 min-w-0 w-full pt-1 mt-1 border-t border-gray-100">
                                                            <span className="text-gray-500 text-[10px] truncate flex-1 min-w-0">{event.location}</span>
                                                            <span className="text-gray-400 italic text-[10px] truncate text-right flex-shrink-0">{event.category}</span>
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
            {/* Legend for recurring activities */}
            <div className="flex flex-wrap gap-4 px-4 pb-2">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-100 border border-sro-primary"></span>
                    <span className="text-xs text-sro-primary font-medium">Nonrecurring Event</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-orange-200 border border-orange-400"></span>
                    <span className="text-xs text-orange-800 font-medium">Recurring Event</span>
                </div>
            </div>
            <div className="flex justify-center mt-auto border-t pt-4 pb-4">
                <Link to={calendarLink}>
                    <Button className="bg-sro-secondary hover:bg-sro-secondary/90 text-white text-sm flex items-center gap-1">
                        View Monthly Calendar <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

WeeklyCalendar.propTypes = {
    events: PropTypes.array,
    loading: PropTypes.bool,
    onEventClick: PropTypes.func,
    calendarLink: PropTypes.string,
    onMoreActivitiesClick: PropTypes.func,
};

export default WeeklyCalendar;
