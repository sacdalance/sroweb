import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { FileText, BookOpen, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button"; // Importing shadcn button
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // Using shadcn card

const Login = () => {
    const navigate = useNavigate();

    // Function to handle Google Sign-In
    const handleGoogleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: "http://localhost:5173/" }, // Redirect user to homepage after login
        });
        if (error) console.error("Login error:", error.message);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            {/* Left Section: System Title and Description */}
            <div className="w-1/2 p-10">
                <div className="max-w-lg">
                    {/* Graduation Cap Icon */}
                    <GraduationCap className="w-10 h-10 text-[#7B1113] mb-4" />

                    {/* Main Title */}
                    <h1 className="text-4xl font-bold text-[#7B1113] mb-4">SRO Management System</h1>

                    {/* Short System Description */}
                    <p className="text-gray-600">
                        Access a centralized platform for organization activities, appointment scheduling, and
                        report submissions with the SRO Management System.
                    </p>
                </div>
            </div>

            {/* Right Section: Login Box (Using shadcn Card Component) */}
            <Card className="w-1/3 bg-white rounded-lg shadow-lg text-center">
                <CardHeader className="flex flex-col items-center">
                    {/* Placeholder for SRO Logo */}
                    <img 
                        src="https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-1/385740471_2006953466315668_9045008695325744888_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=111&ccb=1-7&_nc_sid=1d2534&_nc_ohc=wp-oTCTvzYsQ7kNvgHuY2Wu&_nc_oc=AdksonZQu8AljaRHynN4N94WAv95W_GiMxTRiX9NMmkYcRlOq4hLPoiiAaG9Snfyj7c&_nc_zt=24&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=sP8LX00PKeNUPG3X71j4ow&oh=00_AYEeHqL03FIs8xRq4lUpAuTwnua-V1nAHbuXy5JkpLK9RA&oe=67E1EEE3" // Change this to the actual SRO logo
                        alt="SRO Logo" 
                        className="w-20 h-20" 
                    />

                    {/* Welcome Text */}
                    <h2 className="text-2xl font-bold mt-2">Welcome!</h2>
                    <p className="text-gray-500">Access the SRO Management System</p>
                </CardHeader>

                <CardContent>
                    {/* Google Login Button */}
                    <Button
                        onClick={handleGoogleSignIn}
                        className="w-full bg-[#7B1113] text-white py-2 rounded-md hover:bg-[#5e0d0e] transition mb-6"
                    >
                        Login with UPmail
                    </Button>

                    {/* Feature Icons Section */}
                    <div className="flex justify-around text-[#7B1113]">
                        {/* Activity Requests */}
                        <div className="flex flex-col items-center">
                            <FileText className="w-6 h-6 mb-1" /> {/* Icon */}
                            <p className="text-sm">Activity Requests</p> {/* Description */}
                        </div>

                        {/* Annual Reports */}
                        <div className="flex flex-col items-center">
                            <BookOpen className="w-6 h-6 mb-1" /> {/* Icon */}
                            <p className="text-sm">Annual Reports</p> {/* Description */}
                        </div>

                        {/* Org Recognition */}
                        <div className="flex flex-col items-center">
                            <Users className="w-6 h-6 mb-1" /> {/* Icon */}
                            <p className="text-sm">Org Recognition</p> {/* Description */}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
