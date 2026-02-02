import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const UpcomingActivitiesWidget = ({ events = [], className }) => {
    // Filter and sort for the next 4 upcoming events
    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return events
            .filter(e => {
                const eventDate = new Date(e.date);
                return eventDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 4);
    }, [events]);

    return (
        <Card className={cn("flex flex-col h-full shadow-sm border border-gray-200", className)}>
            <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-lg font-bold text-sro-primary flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Upcoming Activities
                    </span>
                    <Link to="/admin/student-activities" className="text-xs font-normal text-gray-500 hover:text-sro-primary">
                        View Calendar →
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                {upcomingEvents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <p className="text-sm">No upcoming activities scheduled.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-gray-900 line-clamp-1 text-sm">{event.name}</h4>
                                    <span className="text-xs font-medium text-sro-primary bg-sro-primary/5 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {event.time}
                                    </span>
                                    <span className="flex items-center gap-1 line-clamp-1">
                                        <MapPin className="w-3 h-3" />
                                        {event.location || "TBD"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{event.organization}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UpcomingActivitiesWidget;
