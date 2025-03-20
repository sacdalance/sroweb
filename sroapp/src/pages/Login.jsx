import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import supabase from "@/lib/supabase"; // Import the Supabase client

const Login = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate(); // Initialize navigate function

    useEffect(() => {
        // Check if user is already logged in
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                navigate("/"); // Redirect to dashboard if logged in
            }
        };
        checkUser();

        // Listen for authentication state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
                navigate("/"); // Redirect to dashboard after login
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    const handleGoogleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: "http://localhost:5173/", // Edit this to dashboard route
            },
        });
        if (error) console.error("Login error:", error.message);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center mb-4">
                    {user ? `Welcome, ${user.email}` : "Login"}
                </h2>

                {user ? (
                    <button 
                        onClick={handleSignOut} 
                        className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
                    >
                        Sign Out
                    </button>
                ) : (
                    <button 
                        onClick={handleGoogleSignIn} 
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Sign in with Google
                    </button>
                )}
            </div>
        </div>
    );
};

export default Login;
