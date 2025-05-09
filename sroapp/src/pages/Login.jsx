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
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
            {/* Left Section: System Title and Description */}
            <div className="w-1/2 p-10">
                <div className="max-w-lg">
                    {/* Graduation Cap Icon */}
                    <GraduationCap className="w-12 h-12 text-[#7B1113] mb-5" />

                    {/* Main Title */}
                    <h1 className="text-5xl font-bold text-[#7B1113] mb-4">
                        SRO Management System
                    </h1>

                    {/* Short System Description */}
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Access a centralized platform for organization activities, appointment scheduling, and
                        report submissions with the SRO Management System.
                    </p>
                </div>
            </div>

            {/* Right Section: Login Box (Using shadcn Card Component) */}
            <Card className="w-1/3 bg-white rounded-2xl shadow-lg text-center">
                <CardHeader className="flex flex-col items-center pt-8">
                    {/* SRO Logo */}
                    <img 
                        src="/sms-logo.png" 
                        alt="SRO Logo" 
                        className="w-50 h-50 mb-4" 
                    />

                    {/* Welcome Text */}
                    <h2 className="text-3xl font-bold mt-2">Welcome!</h2>
                    <p className="text-gray-500 text-base mt-1">Access the SRO Management System</p>
                </CardHeader>

                <CardContent className="px-6 pb-8">
                    {/* Google Login Button */}
                    <Button
                        onClick={handleGoogleSignIn}
                        className="w-full bg-[#7B1113] text-white py-3 text-lg font-semibold rounded-md 
                            transition-transform duration-200 ease-in-out transform 
                            hover:scale-105 active:scale-100 motion-safe:hover:shadow-lg cursor-pointer mb-8"
                    >
                        Login with UPmail
                    </Button>

                    {/* Feature Icons Section */}
                    <div className="flex justify-around text-[#7B1113] text-base">
                        {/* Activity Requests */}
                        <div className="flex flex-col items-center">
                            <FileText className="w-7 h-7 mb-1" />
                            <p className="font-medium">Activity Requests</p>
                        </div>

                        {/* Annual Reports */}
                        <div className="flex flex-col items-center">
                            <BookOpen className="w-7 h-7 mb-1" />
                            <p className="font-medium">Annual Reports</p>
                        </div>

                        {/* Org Recognition */}
                        <div className="flex flex-col items-center">
                            <Users className="w-7 h-7 mb-1" />
                            <p className="font-medium">Org Recognition</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
