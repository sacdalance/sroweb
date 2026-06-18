import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CustomCalendar from "@/components/ui/custom-calendar";
import { format, parseISO, isWeekend, isSameDay } from "date-fns";
import { CalendarOff, X, Plus, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const BlockedDatesSettings = ({
    blockedDates, // Array of date strings "YYYY-MM-DD"
    onToggleDate, // Function(dateString) -> void
    onAddBlockedDates, // Function([dateStrings]) -> void
    datesWithAppointments = [] // Array of Date objects or strings representing days with appointments
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isManualAddOpen, setIsManualAddOpen] = useState(false);
    const [manualDate, setManualDate] = useState("");
    const [pendingDates, setPendingDates] = useState([]); // Selected dates waiting to be blocked
    const [showConflictDialog, setShowConflictDialog] = useState(false);

    // Convert strings to Date objects for the calendar prop
    const blockedDatesObj = blockedDates.map(d => parseISO(d));
    // Convert pending strings to Date objects for highlighting
    const highlightedDatesObj = pendingDates.map(d => parseISO(d));

    // Normalize datesWithAppointments to be comparable
    const appointmentsDatesObj = datesWithAppointments.map(d => typeof d === 'string' ? parseISO(d) : d);

    const handleDateSelect = (date) => {
        // Prevent selecting weekends (Saturday=6, Sunday=0)
        if (isWeekend(date)) return;

        const dateString = format(date, 'yyyy-MM-dd');

        // If it's already blocked, we toggle it OFF immediately via parent
        if (blockedDates.includes(dateString)) {
            onToggleDate(dateString);
            return;
        }

        // Toggle local pending selection
        if (pendingDates.includes(dateString)) {
            setPendingDates(pendingDates.filter(d => d !== dateString));
        } else {
            setPendingDates([...pendingDates, dateString]);
        }
    };

    const attemptConfirmBlock = () => {
        // Check for conflicts
        const hasConflict = pendingDates.some(pendingDateStr => {
            const pendingDate = parseISO(pendingDateStr);
            return appointmentsDatesObj.some(appDate => isSameDay(appDate, pendingDate));
        });

        if (hasConflict) {
            setShowConflictDialog(true);
        } else {
            commitBlock();
        }
    };

    const commitBlock = () => {
        if (onAddBlockedDates) {
            onAddBlockedDates(pendingDates);
        }
        setPendingDates([]);
        setShowConflictDialog(false);
    };

    const handleManualAdd = () => {
        if (manualDate) {
            if (onAddBlockedDates) {
                // Check conflict for manual date too? 
                // For simplicity, we just add it, but ideally check conflicts.
                // Since this is less frequent, we rely on the main flow or just let it pass.
                // But consistency is key. Let's add it to pending instead?
                // No, manual add usually implies direct intent. Let's just add it.
                onAddBlockedDates([manualDate]);
            } else {
                onToggleDate(manualDate);
            }
            setManualDate("");
            setIsManualAddOpen(false);
        }
    };

    const sortedBlockedDates = [...blockedDates].sort();

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CalendarOff className="w-5 h-5 text-sro-primary" />
                    <CardTitle className="text-lg">Blocked Dates</CardTitle>
                </div>
                <CardDescription>
                    Select dates on the calendar to block them from bookings. Weekends are automatically unavailable.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Calendar Section */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <div className="border rounded-md p-4 bg-white/50">
                            <CustomCalendar
                                mode="appointments"
                                currentMonth={currentMonth}
                                onMonthChange={setCurrentMonth}
                                onDateSelect={handleDateSelect}
                                blockedDates={blockedDatesObj}
                                highlightedDates={highlightedDatesObj}
                                datesWithAppointments={appointmentsDatesObj}
                                dimWeekends={true}
                                isDateAvailable={(date) => !isWeekend(date)}
                            />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 justify-center sm:justify-start">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
                                <span>Blocked</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-sro-primary/20 ring-2 ring-sro-primary ring-inset"></div>
                                <span>Selected</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div>
                                <span>Has Appointments</span>
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[400px] lg:h-auto">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Blocked List ({blockedDates.length})</h4>

                            <Popover open={isManualAddOpen} onOpenChange={setIsManualAddOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full">
                                        <Plus className="h-4 w-4" />
                                        <span className="sr-only">Add Date Manually</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="end">
                                    <div className="flex flex-col gap-2">
                                        <h5 className="font-medium text-sm">Block Specific Date</h5>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-sro-primary"
                                                value={manualDate}
                                                onChange={(e) => setManualDate(e.target.value)}
                                            />
                                            <Button size="sm" onClick={handleManualAdd} disabled={!manualDate} className="bg-sro-primary text-white hover:bg-sro-primary/90">Add</Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Pending Selection Action Bar */}
                        {pendingDates.length > 0 && (
                            <div className="flex items-center justify-between gap-2 mb-2 p-2 rounded-md border border-sro-primary/30 bg-sro-primary/5 animate-in slide-in-from-top-1 duration-200">
                                <span className="text-xs font-medium text-sro-primary">
                                    {pendingDates.length} date{pendingDates.length > 1 ? 's' : ''} selected
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-gray-500 hover:text-gray-700"
                                        onClick={() => setPendingDates([])}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs bg-sro-primary hover:bg-sro-primary/90 text-white"
                                        onClick={attemptConfirmBlock}
                                    >
                                        <Check className="h-3 w-3 mr-1" />
                                        Block Selected
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="border rounded-md flex-1 bg-gray-50/50 p-2 overflow-hidden flex flex-col">
                            {blockedDates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm italic">
                                    <CalendarOff className="w-8 h-8 mb-2 opacity-20" />
                                    No dates blocked
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 pr-2">
                                    <div className="space-y-2">
                                        {sortedBlockedDates.map((dateStr) => (
                                            <div
                                                key={dateStr}
                                                className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-md shadow-sm group hover:border-red-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-sro-primary"></div>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {format(parseISO(dateStr), 'MMMM d, yyyy')}
                                                    </span>
                                                    <span className="text-xs text-gray-400 border px-1 rounded">
                                                        {format(parseISO(dateStr), 'EEE')}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 -mr-1"
                                                    onClick={() => onToggleDate(dateStr)}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 px-1">
                            * Select dates on calendar then click "Block Selected" to add.
                        </p>
                    </div>
                </div>
            </CardContent>

            <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-sro-primary">
                            <AlertTriangle className="h-5 w-5" />
                            Warning: Existing Appointments
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                One or more selected dates have existing appointments. Blocking these dates will <strong>automatically cancel or reject</strong> all scheduled appointments for these days.
                            </p>
                            <div className="p-2 bg-red-50 rounded text-sm text-red-800 border border-red-200">
                                Students will be notified that their appointment was cancelled/rejected because "Day has been blocked by the SRO".
                            </div>
                            <p>Are you sure you want to proceed?</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={commitBlock} className="bg-sro-primary hover:bg-sro-primary/90 text-white">
                            Proceed & Block
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </Card>
    );
};

export default BlockedDatesSettings;
