import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import { Clock } from "lucide-react";

const ConsultationHoursSettings = ({
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    interval,
    setInterval
}) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-sro-primary" />
                    <CardTitle className="text-lg">Consultation Hours</CardTitle>
                </div>
                <CardDescription>
                    Set your daily availability for student appointments.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Time</label>
                        <input
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Interval</label>
                        <UnifiedDropdown
                            options={[
                                { value: "15", label: "15 Minutes" },
                                { value: "30", label: "30 Minutes" },
                                { value: "45", label: "45 Minutes" },
                                { value: "60", label: "1 Hour" }
                            ]}
                            value={String(interval)}
                            onChange={(val) => setInterval(Number(val))}
                            placeholder="Select interval"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ConsultationHoursSettings;
