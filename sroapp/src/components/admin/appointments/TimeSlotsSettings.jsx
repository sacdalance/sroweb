import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Coffee, CheckCircle2, Ban } from "lucide-react";

const TimeSlotsSettings = ({
    timeSlots,
    blockedTimeSlots, // Array of strings "HH:MM AM/PM"
    onToggleSlot,   // (slot) => void
    onBlockAll,     // () => void
    onUnblockAll,   // () => void
    onBlockLunch    // () => void
}) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-sro-primary" />
                        <div>
                            <CardTitle className="text-lg">Time Slot Management</CardTitle>
                            <CardDescription>
                                Click slots to toggle availability.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={onUnblockAll} className="h-8 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Unblock All
                        </Button>
                        <Button variant="outline" size="sm" onClick={onBlockLunch} className="h-8 text-xs">
                            <Coffee className="w-3.5 h-3.5 mr-1" />
                            Block Lunch (12-1)
                        </Button>
                        <Button variant="outline" size="sm" onClick={onBlockAll} className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Block All
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {timeSlots.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-md">
                        No time slots generated. Check your Start/End time.
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {timeSlots.map((slot) => {
                            const isBlocked = blockedTimeSlots.includes(slot);
                            return (
                                <button
                                    key={slot}
                                    onClick={() => onToggleSlot(slot)}
                                    className={`
                    relative px-2 py-2.5 text-xs sm:text-sm font-medium rounded-md border transition-all duration-200
                    ${isBlocked
                                            ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                            : "bg-white border-gray-200 text-gray-700 hover:border-sro-secondary hover:text-sro-secondary hover:shadow-sm"
                                        }
                  `}
                                >
                                    {slot}
                                    {isBlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-red-100/10 pointer-events-none" aria-hidden="true" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
                <div className="mt-4 flex items-center justify-end gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border border-gray-200 bg-white"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border border-red-200 bg-red-50"></div>
                        <span>Blocked</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TimeSlotsSettings;
