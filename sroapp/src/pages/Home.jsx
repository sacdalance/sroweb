import { useEffect } from "react";
import supabase from "@/lib/supabase";
import { checkOrCreateUser } from "@/api/authAPI";

const Home = () => {
  useEffect(() => {
    const syncUserToBackend = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const email = user.email;
      const fullName = user.user_metadata.full_name;

      try {
        await checkOrCreateUser(email, fullName);
      } catch (err) {
        console.error("User sync failed:", err);
      }
    };

    syncUserToBackend();
  }, []);

  return (
    <h1 className="flex justify-center">
      Welcome to the Student Relations Office Web App
    </h1>
  );
};

export default Home;
