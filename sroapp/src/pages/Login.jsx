import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { FileText, BookOpen, Users, GraduationCap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import UnifiedActivitiesCalendar from "@/components/ui/UnifiedActivitiesCalendar";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";

const fetchApprovedActivities = async () => {
    const { data, error } = await supabase
        .from("activity")
        .select("*, organization:organization(*), schedule:activity_schedule(*)")
        .eq("final_status", "Approved");
    if (error) throw error;
    return data;
};

const fetchOrganizations = async () => {
    const { data, error } = await supabase
        .from("organization")
        .select("org_id, org_name");
    if (error) throw error;
    return data.map((org) => org.org_name).sort((a, b) => a.localeCompare(b));
};

const fetchDialogActivity = async (activityId) => {
    const { data, error } = await supabase
        .from("activity")
        .select("*, schedule:activity_schedule(*), organization:organization(*)")
        .eq("activity_id", activityId)
        .single();
    if (error) throw error;
    return data;
};

const PublicActivityDialog = (props) => (
    <ActivityDialogContent {...props} readOnly={true} publicView={true} />
);

const Login = () => {
    const navigate = useNavigate();
    const infoRef = useRef(null);

    // Function to handle Google Sign-In
    const handleGoogleSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });

        if (error) console.error("Login error:", error.message);
    };

    const scrollToInfo = () => {
        infoRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-gray-100">
            {/* Hero */}
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 px-4 py-16 md:py-4 h-screen snap-start snap-always">
                {/* System Title and Description - hidden on small screens */}
                <div className="w-full md:w-1/2 p-4 md:p-10 flex justify-center">
                    <div className="max-w-lg w-full flex flex-col items-center md:items-start
                    hidden sm:flex">
                        <GraduationCap className="w-10 h-10 lg:w-12 lg:h-12 text-sro-primary mb-3 lg:mb-5" />
                        <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-sro-primary mb-3 lg:mb-4 text-center md:text-left">
                            SRO Management System
                        </h1>
                        <p className="text-sm lg:text-base xl:text-lg text-gray-700 leading-relaxed text-center md:text-left">
                            Access a centralized platform for organization activities, appointment scheduling, and
                            report submissions with the SRO Management System.
                        </p>
                    </div>
                </div>

                {/* Login Box */}
                <div className="w-full md:w-1/3 flex justify-center">
                    <Card className="w-full max-w-md bg-white rounded-2xl shadow-lg text-center">
                        <CardHeader className="flex flex-col items-center pt-6">
                            <img
                                src="/sms-logo.png"
                                alt="SRO Logo"
                                className="w-16 h-16 lg:w-20 lg:h-20 mb-3"
                            />
                            <h2 className="text-xl lg:text-2xl font-bold mt-1">Welcome!</h2>
                            <p className="text-gray-500 text-sm lg:text-base mt-1">Access the SRO Management System</p>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <Button
                                onClick={handleGoogleSignIn}
                                className="w-full bg-sro-primary text-white py-2.5 text-base lg:text-lg font-semibold rounded-md
                                    transition-transform duration-200 ease-in-out transform
                                    hover:scale-105 active:scale-100 motion-safe:hover:shadow-lg cursor-pointer mb-6"
                            >
                                Login with UPmail
                            </Button>
                            <div className="flex flex-row justify-around gap-2 sm:gap-4 text-sro-primary text-sm lg:text-base">
                                <div className="flex flex-col items-center">
                                    <FileText className="w-6 h-6 lg:w-7 lg:h-7 mb-1" />
                                    <p className="font-medium">Activity Requests</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <BookOpen className="w-6 h-6 lg:w-7 lg:h-7 mb-1" />
                                    <p className="font-medium">Annual Reports</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Users className="w-6 h-6 lg:w-7 lg:h-7 mb-1" />
                                    <p className="font-medium">Org Recognition</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Scroll to more info */}
                <button
                    onClick={scrollToInfo}
                    aria-label="Scroll down for more information"
                    className="cursor-pointer absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-sro-primary hover:text-sro-primary/80 transition-colors"
                >
                    <span className="text-xs font-medium">More Info</span>
                    <ChevronDown className="w-5 h-5 animate-bounce" />
                </button>
            </div>

            {/* Activities Calendar */}
            <div ref={infoRef} className="min-h-screen px-4 pb-8 snap-start">
                <UnifiedActivitiesCalendar
                    dialogComponent={PublicActivityDialog}
                    fetchActivities={fetchApprovedActivities}
                    fetchOrganizations={fetchOrganizations}
                    fetchDialogActivity={fetchDialogActivity}
                    calendarTitle="Upcoming Activities"
                />
            </div>
        </div>
    );
};

export default Login;
