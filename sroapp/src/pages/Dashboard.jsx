import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

const Dashboard = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [announcementsError, setAnnouncementsError] = useState(null);

    // Function to check if a date falls within the current week
    const isDateInCurrentWeek = (dateString) => {
        const eventDate = new Date(dateString);
        eventDate.setHours(0, 0, 0, 0); // Normalize time to start of day
        
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
        weekEnd.setHours(23, 59, 59, 999);
        
        return eventDate >= weekStart && eventDate <= weekEnd;
    };

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

    // Function to fetch announcements from Supabase
    const fetchAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('posted_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setAnnouncementsError(err.message);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    // Fetch announcements on component mount
    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Fetch activities from Supabase
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('activity')
                    .select(`
                        *,
                        organization:organization(*),
                        schedule:activity_schedule(*)
                    `)
                    .eq('final_status', 'Approved');

                if (error) throw error;

                // Transform the data to match our events structure
                const transformedEvents = data.map(activity => ({
                    id: activity.activity_id,
                    name: activity.activity_name,
                    time: `${activity.schedule[0]?.start_time || '00:00'} to ${activity.schedule[0]?.end_time || '00:00'}`,
                    location: activity.venue,
                    category: activity.activity_type,
                    organization: activity.organization?.org_name,
                    date: activity.schedule[0]?.start_date
                }));

                setEvents(transformedEvents);
            } catch (err) {
                console.error('Error fetching activities:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    // Filter events for the current week
    const filteredEvents = events.filter(event => isDateInCurrentWeek(event.date));

    return (
        <div className="max-w-[1500px] mx-auto p-6">
            <Card className="shadow-sm px-6 py-4 mb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold">
                        Welcome to SRO All-in-One Web App
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        This portal allows you to manage your organization activities and requests. Use the sidebar to navigate through different sections.
                    </p>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Announcements Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-[#7B1113]">Announcements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {announcementsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#7B1113]" />
                                    <span className="ml-2 text-gray-600">Loading announcements...</span>
                                </div>
                            ) : announcementsError ? (
                                <div className="text-center py-4 text-red-500">
                                    Error loading announcements: {announcementsError}
                                </div>
                            ) : announcements.length > 0 ? (
                                announcements.map((announcement) => (
                                    <div key={announcement.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 rounded-full bg-[#7B1113] mt-2"></div>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Posted: {new Date(announcement.posted_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No announcements available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Activities Calendar Section */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-bold text-[#7B1113]">Activities Calendar</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 border-[#014421] text-[#014421]"
                                    onClick={() => handleWeekNavigation('prev')}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium">{getWeekRange(currentWeekStart)}</span>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 border-[#014421] text-[#014421]"
                                    onClick={() => handleWeekNavigation('next')}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Days of the week with day numbers */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {Array.from({ length: 7 }, (_, i) => {
                                const date = new Date(currentWeekStart);
                                date.setDate(date.getDate() - date.getDay() + i);
                                const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i];
                                const isToday = new Date().toDateString() === date.toDateString();
                                
                                return (
                                    <div key={i} className="flex flex-col items-center">
                                        <div 
                                            className={`text-sm font-medium py-1
                                                ${isToday ? 'text-[#7B1113] font-bold' : 'text-gray-600'}
                                            `}
                                        >
                                            {day}
                                        </div>
                                        <div className={`text-sm ${isToday ? 'text-[#7B1113] font-bold' : 'text-gray-500'}`}>
                                            {date.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Calendar Events */}
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-[#7B1113]" />
                                <span className="ml-2 text-gray-600">Loading activities...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-4 text-red-500">
                                Error loading activities: {error}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    // Check if we're viewing the current week
                                    const currentWeekStartDate = new Date(currentWeekStart);
                                    const currentWeekEndDate = new Date(currentWeekStart);
                                    currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 6);
                                    
                                    const isCurrentWeek = today >= currentWeekStartDate && today <= currentWeekEndDate;

                                    if (isCurrentWeek) {
                                        // For current week, show activities only for today with filler if none
                                        const todayEvents = filteredEvents.filter(event => {
                                            const eventDate = new Date(event.date);
                                            eventDate.setHours(0, 0, 0, 0);
                                            return eventDate.getTime() === today.getTime();
                                        });

                                        if (todayEvents.length > 0) {
                                            return todayEvents.map((event) => (
                                                <div key={event.id} className="bg-[#7B1113] rounded-lg overflow-hidden">
                                                    <div className="p-3 space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center text-white text-sm">
                                                                    <span>{event.time}</span>
                                                                    <span className="mx-1">•</span>
                                                                    <span>{event.location}</span>
                                                                </div>
                                                                <h3 className="text-white font-bold text-lg">
                                                                    {event.name}
                                                                </h3>
                                                            </div>
                                                            <div className="flex flex-col items-end text-sm">
                                                                <span className="text-white">{event.organization}</span>
                                                                <span className="text-white/80 italic">{event.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        } else {
                                            return (
                                                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                                    <div className="p-6 text-center">
                                                        <h3 className="text-gray-500 text-lg font-medium mb-1">No Activities Today</h3>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    } else {
                                        // For other weeks, show all activities of that week
                                        const weekEvents = filteredEvents.filter(event => {
                                            const eventDate = new Date(event.date);
                                            return eventDate >= currentWeekStartDate && eventDate <= currentWeekEndDate;
                                        });

                                        if (weekEvents.length > 0) {
                                            return weekEvents.map((event) => (
                                                <div key={event.id} className="bg-[#7B1113] rounded-lg overflow-hidden">
                                                    <div className="p-3 space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center text-white text-sm">
                                                                    <span>{event.time}</span>
                                                                    <span className="mx-1">•</span>
                                                                    <span>{event.location}</span>
                                                                </div>
                                                                <h3 className="text-white font-bold text-lg">
                                                                    {event.name}
                                                                </h3>
                                                            </div>
                                                            <div className="flex flex-col items-end text-sm">
                                                                <span className="text-white">{event.organization}</span>
                                                                <span className="text-white/80 italic">{event.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        } else {
                                            return (
                                                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                                    <div className="p-6 text-center">
                                                        <h3 className="text-gray-500 text-lg font-medium mb-1">No Activities This Week</h3>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    }
                                })()}
                            </div>
                        )}
                        <div className="flex justify-center mt-4 border-t pt-4">
                            <Link to="/activities-calendar">
                                <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                                    See Activities Calendar <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
