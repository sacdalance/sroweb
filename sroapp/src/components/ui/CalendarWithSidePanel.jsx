import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomCalendar from "@/components/ui/custom-calendar";
import { format } from "date-fns";
import { Calendar, ClipboardList } from "lucide-react";

/**
 * A unified component that displays a CustomCalendar on the left (2/3) 
 * and a Side Panel on the right (1/3) for details.
 * 
 * @param {Object} props
 * @param {Date} props.currentDate - The current month view
 * @param {Function} props.onMonthChange - Handler for changing month
 * @param {Date} props.selectedDate - The currently selected date
 * @param {Function} props.onDateSelect - Handler for selecting a date
 * @param {Array} props.events - List of events to display
 * @param {Function} props.getEventColor - Function to determine event color class
 * @param {Array} props.legendItems - Array of { label, colorClass } for the legend
 * @param {Function} props.renderSidePanel - Render prop for the side panel content (receives selectedDate, filteredEvents)
 * @param {string} props.sidePanelTitle - Title for the side panel
 * @param {string} props.emptyMessage - Message to show when no events for selected date
 */
const CalendarWithSidePanel = ({
    currentDate,
    onMonthChange,
    selectedDate,
    onDateSelect,
    events = [],
    getEventColor,
    legendItems = [],
    filters = [],
    sidePanelData = [],
    renderSidePanelItem,
    sidebarTitle,
    emptyMessage = "No scheduled items",
    itemsPerPage = 5
}) => {
    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1);

    // Reset page when date changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedDate]);

    // Pagination Logic
    const totalItems = sidePanelData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = sidePanelData.slice(startIndex, endIndex);

    const handleDateSelect = (dateOrEvent) => {
        // Standardize event back to just date object for selection state
        const date = dateOrEvent instanceof Date
            ? dateOrEvent
            : (dateOrEvent.date ? new Date(dateOrEvent.date) : null);

        if (onDateSelect && date) {
            onDateSelect(date);
        }
    };

    return (
        <div className="flex flex-col gap-4">


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Column */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow border p-4 flex flex-col gap-4">
                    {/* Legend / Header Controls */}
                    {/* Header Row: Legends (Left) & Filters (Right) */}
                    {(legendItems.length > 0 || filters.length > 0) && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-1">
                            {/* Legends */}
                            <div className="flex gap-3 sm:gap-4 flex-wrap">
                                {legendItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${item.indicatorClass || 'bg-gray-300'}`} />
                                        <span className="text-[10px] sm:text-xs font-medium text-gray-900">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Filters */}
                            {filters.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {filters.map((filter, idx) => (
                                        <label key={idx} className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md shadow-sm border text-xs sm:text-sm hover:bg-gray-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filter.checked}
                                                onChange={(e) => filter.onChange(e.target.checked)}
                                                className="rounded text-sro-primary focus:ring-sro-primary w-3.5 h-3.5 border-gray-300"
                                            />
                                            <span className="font-medium text-gray-700">{filter.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <CustomCalendar
                        mode="activities"
                        currentMonth={currentDate}
                        onMonthChange={onMonthChange}
                        onDateSelect={handleDateSelect}
                        selectedDate={selectedDate}
                        events={events}
                        getEventColor={getEventColor}
                    />
                </div>

                {/* Side Panel Column */}
                <div className="lg:col-span-1">
                    <Card className="h-full border border-gray-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-3 border-b border-gray-100 bg-white shrink-0">
                            <CardTitle className="text-lg flex items-center gap-2 text-sro-primary font-bold">
                                {selectedDate ? (
                                    <>
                                        <Calendar className="w-5 h-5" />
                                        {format(selectedDate, 'MMMM d, yyyy')}
                                    </>
                                ) : (
                                    sidebarTitle || 'Select a date'
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col min-h-[400px]">
                            {selectedDate ? (
                                sidePanelData.length > 0 ? (
                                    <div className="flex flex-col h-full justify-between">
                                        <div className="space-y-3">
                                            {currentItems.map((item, index) => (
                                                <div key={index}>
                                                    {renderSidePanelItem(item, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                                >
                                                    <span className="sr-only">Previous</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                                </button>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                                >
                                                    <span className="sr-only">Next</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 h-full">
                                        <ClipboardList className="w-10 h-10 mb-2 opacity-20" />
                                        <p className="text-sm">{emptyMessage}</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm font-medium text-gray-500">No date selected</p>
                                    <p className="text-xs">Click on the calendar to view details</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CalendarWithSidePanel;
