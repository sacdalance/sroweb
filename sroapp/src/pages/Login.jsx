import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { FileText, BookOpen, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const Login = () => {
    const navigate = useNavigate();

    // Function to handle Google Sign-In
    const handleGoogleSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: "http://localhost:5173/" },
        });

        if (error) console.error("Login error:", error.message);
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen items-center justify-center bg-gray-100 px-4 py-4">
            {/* System Title and Description - hidden on small screens */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex justify-center">
                <div className="max-w-lg w-full flex flex-col items-center md:items-start
                hidden sm:flex">
                    <GraduationCap className="w-12 h-12 text-[#7B1113] mb-5" />
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#7B1113] mb-4 text-center md:text-left">
                        SRO Management System
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed text-center md:text-left">
                        Access a centralized platform for organization activities, appointment scheduling, and
                        report submissions with the SRO Management System.
                    </p>
                </div>
            </div>

            {/* Login Box */}
            <div className="w-full md:w-1/3 flex justify-center mb-8 md:mb-0">
                <Card className="w-full max-w-md bg-white rounded-2xl shadow-lg text-center">
                    <CardHeader className="flex flex-col items-center pt-8">
                        <img 
                            src="/sms-logo.png" 
                            alt="SRO Logo" 
                            className="w-24 h-24 mb-4" 
                        />
                        <h2 className="text-2xl md:text-3xl font-bold mt-2">Welcome!</h2>
                        <p className="text-gray-500 text-base mt-1">Access the SRO Management System</p>
                    </CardHeader>
                    <CardContent className="px-6 pb-8">
                        <Button
                            onClick={handleGoogleSignIn}
                            className="w-full bg-[#7B1113] text-white py-3 text-lg font-semibold rounded-md 
                                transition-transform duration-200 ease-in-out transform 
                                hover:scale-105 active:scale-100 motion-safe:hover:shadow-lg cursor-pointer mb-8"
                        >
                            Login with UPmail
                        </Button>
                        <div className="flex flex-row justify-around gap-4 text-[#7B1113] text-base">
                            <div className="flex flex-col items-center">
                                <FileText className="w-7 h-7 mb-1" />
                                <p className="font-medium">Activity Requests</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <BookOpen className="w-7 h-7 mb-1" />
                                <p className="font-medium">Annual Reports</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <Users className="w-7 h-7 mb-1" />
                                <p className="font-medium">Org Recognition</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;
