import { useCallback, useEffect, useRef, useState } from "react";
import supabase from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

const IdleTimeoutWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_BEFORE_MS / 1000);
  const warnTimer = useRef(null);
  const logoutTimer = useRef(null);
  const countdownInterval = useRef(null);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Clear session even if the API call fails
    }
    window.location.href = "/login";
  }, []);

  const clearTimers = () => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    clearInterval(countdownInterval.current);
  };

  const resetTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);

    warnTimer.current = setTimeout(() => {
      setSecondsLeft(WARNING_BEFORE_MS / 1000);
      setShowWarning(true);

      countdownInterval.current = setInterval(() => {
        setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);

      logoutTimer.current = setTimeout(signOut, WARNING_BEFORE_MS);
    }, IDLE_LIMIT_MS - WARNING_BEFORE_MS);
  }, [signOut]);

  useEffect(() => {
    resetTimers();

    const handleActivity = () => {
      if (!showWarning) resetTimers();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [resetTimers, showWarning]);

  const handleStayLoggedIn = () => {
    resetTimers();
  };

  return (
    <Dialog open={showWarning} onOpenChange={(open) => { if (!open) handleStayLoggedIn(); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-sro-primary">Are you still there?</DialogTitle>
          <DialogDescription>
            You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{" "}
            <strong>{secondsLeft}</strong> second{secondsLeft === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={signOut}>Sign Out Now</Button>
          <Button variant="sro-secondary" onClick={handleStayLoggedIn}>Stay Logged In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IdleTimeoutWarning;
