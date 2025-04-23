import { useState, useEffect } from "react";
import supabase from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight, Calendar, Clock, Edit, X } from "lucide-react";
import { format, addMonths, subMonths, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, isPast } from "date-fns";
import { toast } from 'sonner';

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reason: "",
    email: "",
    contact: "",
    date: null,
    time: "",
    mode: "",
    notes: ""
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExistingAppointments, setShowExistingAppointments] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [datesWithAppointments, setDatesWithAppointments] = useState([]);
  const [timeSlotLoading, setTimeSlotLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");

  const appointmentReasons = [
    "Select a reason for booking an appointment with the SRO...",
    "Consultation",
    "Organization Registration",
    "Event Approval",
    "Other"
  ];

  const meetingModes = [
    "Face-to-face",
    "Online (Google Meet)"
  ];

  // Load user data
  useEffect(() => {
    const getUser = async () => {
      try {
        // Log the auth state first
        console.log("Fetching auth user data...");
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("Auth error:", authError);
          return;
        }
        
        console.log("Auth user data:", authUser);
        
        if (authUser) {
          // First try to get account by supabase_uid if it exists
          console.log("Fetching account data for supabase_uid:", authUser.id);
          let { data: accountData, error: accountError } = await supabase
            .from('account')
            .select('*')
            .eq('supabase_uid', authUser.id)
            .maybeSingle();
          
          // If no account is found by supabase_uid, try to find by email
          if (!accountData && authUser.email) {
            console.log("No account found by supabase_uid, trying with email:", authUser.email);
            const { data: emailAccount, error: emailError } = await supabase
              .from('account')
              .select('*')
              .eq('email', authUser.email)
              .maybeSingle();
            
            if (emailAccount) {
              console.log("Found account by email:", emailAccount);
              // Update the account with the supabase_uid for future logins
              const { data: updatedAccount, error: updateError } = await supabase
                .from('account')
                .update({ supabase_uid: authUser.id })
                .eq('account_id', emailAccount.account_id)
                .select();
              
              if (updateError) {
                console.error("Failed to update account with supabase_uid:", updateError);
              } else {
                console.log("Updated account with supabase_uid:", updatedAccount);
                accountData = updatedAccount[0];
              }
            } else if (emailError) {
              console.error("Error fetching account by email:", emailError);
            }
          }
          
          // If still no account found, try to get admin account (fallback)
          if (!accountData) {
            console.log("No account found, checking for admin account");
            const { data: adminData, error: adminError } = await supabase
              .from('account')
              .select('*')
              .eq('role_id', 1)
              .limit(1);
            
            if (!adminError && adminData && adminData.length > 0) {
              console.log("Found admin account:", adminData[0]);
              
              // If user is not linked to an account but we have their email from auth,
              // we could optionally create an account for them here
              
              setUser(adminData[0]);
              
              // Pre-fill email if available
              if (adminData[0]?.email) {
                setFormData(prev => ({ ...prev, email: adminData[0].email }));
              } else if (authUser.email) {
                setFormData(prev => ({ ...prev, email: authUser.email }));
              }
              
              // Load user's appointments
              loadUserAppointments(adminData[0].account_id);
              return;
            }
          }
          
          if (accountData) {
            console.log("Using account data:", accountData);
          setUser(accountData);
          
          // Pre-fill email if available
          if (accountData?.email) {
            setFormData(prev => ({ ...prev, email: accountData.email }));
            } else if (authUser.email) {
              setFormData(prev => ({ ...prev, email: authUser.email }));
          }
          
          // Load user's appointments
          loadUserAppointments(accountData.account_id);
          } else {
            console.error("No account found for user:", authUser);
            toast.error("Account not found. Please contact an administrator.");
          }
        } else {
          console.log("No authenticated user found");
          toast.error("Please log in to book an appointment");
        }
      } catch (error) {
        console.error("Error in getUser:", error);
        toast.error("Error loading user data");
      }
    };
    
    getUser();
  }, []);

  // Load user's existing appointments
  const loadUserAppointments = async (userId) => {
    if (!userId) {
      console.log("No user ID provided, skipping appointment loading");
      setExistingAppointments([]);
      setLoadingAppointments(false);
      return;
    }
    
    try {
      setLoadingAppointments(true);
      console.log(`Loading appointments for user ID: ${userId}`);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('account_id', userId)
        .order('appointment_date', { ascending: true });
      
      if (error) {
        console.error("Error loading user appointments:", error);
        toast.error("Failed to load your appointments");
        setExistingAppointments([]);
      } else {
        console.log(`Found ${data.length} appointments for user`);
      setExistingAppointments(data || []);
      }
    } catch (error) {
      console.error("Error loading user appointments:", error);
      toast.error("Failed to load your appointments");
      setExistingAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Load blocked dates and appointment settings
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("Loading appointment settings and blocked dates...");
        
        // Get appointment settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('appointment_settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (settingsError) {
          console.error("Error fetching settings:", settingsError);
          throw settingsError;
        }
        
        if (settingsData && settingsData.length > 0) {
          console.log("Appointment settings loaded:", settingsData[0]);
          setSettings(settingsData[0]);
        } else {
          console.log("No appointment settings found, using defaults");
          // Set default settings if none found
          setSettings({
            allowed_days: [1, 2, 3, 4, 5], // Monday to Friday
            advance_days: 14
          });
        }
        
        // Get blocked dates
        const { data: blockedDatesData, error: blockedDatesError } = await supabase
          .from('blocked_dates')
          .select('date');
        
        if (blockedDatesError) {
          console.error("Error fetching blocked dates:", blockedDatesError);
          throw blockedDatesError;
        }
        
        if (blockedDatesData && blockedDatesData.length > 0) {
          console.log(`Loaded ${blockedDatesData.length} blocked dates`);
          const formattedBlockedDates = blockedDatesData.map(item => new Date(item.date));
          setBlockedDates(formattedBlockedDates);
        } else {
          console.log("No blocked dates found");
          setBlockedDates([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading appointment data:", error);
        toast.error("Failed to load appointment settings");
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load available time slots based on date and settings
  const loadTimeSlots = async (date) => {
    try {
      setTimeSlotLoading(true);
      
      // Format the date to match the database
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log(`Loading time slots for date: ${formattedDate}`);
      
      // Get appointment settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      let defaultTimeSlots = [];
      
      if (settingsError) {
        console.error("Error fetching settings:", settingsError);
      } else if (settingsData && settingsData.length > 0) {
        console.log("Settings found:", settingsData[0]);
        
        // Generate time slots based on start_time, end_time, and interval_minutes
        const settings = settingsData[0];
        
        // Parse start and end times
        const startTimeParts = settings.start_time.split(':');
        const endTimeParts = settings.end_time.split(':');
        
        const startHour = parseInt(startTimeParts[0]);
        const startMinute = parseInt(startTimeParts[1]);
        const endHour = parseInt(endTimeParts[0]);
        const endMinute = parseInt(endTimeParts[1]);
        
        const interval = settings.interval_minutes;
        
        // Generate time slots
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          defaultTimeSlots.push(timeString);
          
          // Increment by interval
          currentMinute += interval;
          if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
          }
        }
      }
      
      // If no settings or time_slots not defined, use default time slots
      if (defaultTimeSlots.length === 0) {
        defaultTimeSlots = [
          "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"
        ];
        console.log("Using default time slots:", defaultTimeSlots);
      }
      
      // Load blocked time slots
      const { data: blockedTimeSlots, error: blockedTimeSlotsError } = await supabase
        .from('blocked_time_slots')
        .select('time_slot');
      
      if (blockedTimeSlotsError) {
        console.error("Error loading blocked time slots:", blockedTimeSlotsError);
      } else if (blockedTimeSlots && blockedTimeSlots.length > 0) {
        console.log("Blocked time slots:", blockedTimeSlots);
        
        // Filter out blocked time slots
        const blockedTimes = blockedTimeSlots.map(item => {
          // Convert time format to match our format (HH:MM)
          const timeParts = item.time_slot.split(':');
          return `${timeParts[0]}:${timeParts[1]}`;
        });
        
        defaultTimeSlots = defaultTimeSlots.filter(slot => !blockedTimes.includes(slot));
      }
      
      // Load existing appointments for the selected date to check availability
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', formattedDate);
      
      if (appointmentsError) {
        console.error("Error loading existing appointments:", appointmentsError);
        // Continue with default slots even if there's an error loading appointments
      }
      
      // Filter out slots that are already booked
      let availableSlots = [...defaultTimeSlots];
      
      if (existingAppointments && existingAppointments.length > 0) {
        console.log("Existing appointments:", existingAppointments);
        
        // Get all booked time slots
        const bookedTimes = existingAppointments.map(appointment => {
          // Convert time format to match our format (HH:MM)
          const timeParts = appointment.appointment_time.split(':');
          return `${timeParts[0]}:${timeParts[1]}`;
        });
        
        console.log("Booked times:", bookedTimes);
        
        // Remove booked slots
        availableSlots = availableSlots.filter(slot => !bookedTimes.includes(slot));
      }
      
      console.log("Final available time slots:", availableSlots);
      setTimeSlots(availableSlots);
      setTimeSlotLoading(false);
    } catch (error) {
      console.error("Error loading time slots:", error);
      toast.error("Failed to load available time slots");
      
      // Provide default time slots even if there's an error
      const defaultSlots = [
        "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"
      ];
      setTimeSlots(defaultSlots);
      setTimeSlotLoading(false);
    }
  };

  // Handle date selection
  const handleDateChange = (date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      loadTimeSlots(date);
    } else {
      toast.error("This date is not available for booking");
    }
  };

  // Fetch appointments for the current month to display in calendar
  useEffect(() => {
    fetchMonthAppointments();
  }, [currentMonth]);

  // Extract fetchMonthAppointments to separate function so it can be called elsewhere
  const fetchMonthAppointments = async () => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(monthEnd, 'yyyy-MM-dd');
      
      // Get all confirmed appointments for this month
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr)
        .eq('status', 'scheduled');
      
      if (error) throw error;
      
      // Convert to date objects and store in state
      const dates = data.map(item => new Date(item.appointment_date));
      setDatesWithAppointments(dates);
    } catch (error) {
      console.error("Error fetching month appointments:", error);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle previous month navigation
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Handle next month navigation
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return dateRange;
  };

  // Check if date is allowed for booking - improved version
  const isDateAvailable = (date) => {
    // Get today and tomorrow dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // First check for past dates - always unavailable
    if (isPast(date) && !isToday(date)) {
      return false;
    }
    
    // Cannot book for today
    if (isToday(date)) {
      return false;
    }
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = getDay(date);
    
    // Calculate the maximum allowed date (default 14 business days)
    const advanceDays = settings?.advance_days || 14;
    let businessDaysAhead = 0;
    let maxDate = new Date(today);
    
    while (businessDaysAhead < advanceDays) {
      maxDate.setDate(maxDate.getDate() + 1);
      const dayOfWeek = maxDate.getDay();
      // Skip weekends unless specifically allowed in settings
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysAhead++;
      }
    }
    
    // Date must be between tomorrow and maxDate
    if (date < tomorrow || date > maxDate) {
      return false;
    }
    
    // Check if day of week is allowed by admin settings
    if (settings && settings.allowed_days) {
      if (!settings.allowed_days.includes(dayOfWeek)) {
        return false;
      }
    } else {
      // Default to allowing weekdays only (1-5, Monday to Friday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
      }
    }
    
    // Check if date is blocked by admin
    if (blockedDates.some(blockedDate => isSameDay(date, blockedDate))) {
      return false;
    }
    
    // If we made it here, the date is available
    return true;
  };

  // Toggle view between booking form and existing appointments
  const toggleAppointmentsView = () => {
    setShowExistingAppointments(!showExistingAppointments);
  };

  // Request appointment reschedule
  const requestReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleMode(true);
    setSelectedDate(null);
    setFormData({
      ...formData,
      date: null,
      time: "",
      reason: appointment.reason || ""
    });
    setShowExistingAppointments(false);
  };

  // Submit reschedule request
  const submitRescheduleRequest = async () => {
    if (!selectedAppointment || !formData.date || !formData.time) {
      setError("Please select a new date and time for your appointment");
      return;
    }
    
    try {
      setSubmitting(true);
      
      const appointmentId = selectedAppointment.id;
      const newDate = format(formData.date, 'yyyy-MM-dd');
      
      // Update the appointment directly in the database
      const { data, error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          appointment_time: formData.time,
          notes: formData.notes || "Rescheduled by user"
        })
        .eq('id', appointmentId);
      
      if (error) {
        throw new Error(error.message || "Failed to reschedule appointment");
      }
      
      // Success
      toast.success("Appointment rescheduled successfully!");
      setSuccess(true);
      setSubmitting(false);
      setRescheduleMode(false);
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      setError(error.message || "Failed to reschedule appointment. Please try again later.");
      setSubmitting(false);
    }
  };

  // Request appointment cancellation
  const showCancelRequest = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelForm(true);
    setShowExistingAppointments(false);
  };

  // Submit cancellation request
  const submitCancellationRequest = async () => {
    if (!selectedAppointment || !cancelReason) {
      setError("Please provide a reason for cancellation");
      return;
    }
    
    try {
      setSubmitting(true);
      
      const appointmentId = selectedAppointment.id;
      
      // Update the appointment status directly in the database
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: cancelReason || "Cancelled by user"
        })
        .eq('id', appointmentId);
      
      if (error) {
        throw new Error(error.message || "Failed to cancel appointment");
      }
      
      // Success
      toast.success("Appointment cancelled successfully!");
      setSuccess(true);
      setSubmitting(false);
      setShowCancelForm(false);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setError(error.message || "Failed to cancel appointment. Please try again later.");
      setSubmitting(false);
    }
  };

  // Cancel reschedule/cancel mode
  const cancelRequestMode = () => {
    setRescheduleMode(false);
    setShowCancelForm(false);
    setSelectedAppointment(null);
    setCancelReason("");
    setError("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    // Detailed user debugging
    console.log("Current user object:", user);
    console.log("Form submission started with data:", { ...formData, selectedDate, selectedTime });
    
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }
    
    // Check if user exists and has account_id
    if (!user) {
      console.error("No user found at all");
      toast.error("You must be logged in to book an appointment");
      return;
    }
    
    // Show what's in the user object
    console.log("User properties:", Object.keys(user));
    
    // Determine which ID to use
    let userAccountId = user.account_id;
    
    if (!userAccountId) {
      console.error("User object is missing account_id:", user);
      
      // Fallback: Check if there's a different ID field we could use
      const possibleIdFields = ['id', 'user_id', 'uid'];
      
      for (const field of possibleIdFields) {
        if (user[field]) {
          userAccountId = user[field];
          console.log(`Found alternative ID field: ${field} with value ${userAccountId}`);
          break;
        }
      }
      
      if (!userAccountId) {
        toast.error("User account data is incomplete. Please contact support.");
        return;
      }
      
      console.log(`Using fallback ID: ${userAccountId} instead of account_id`);
    }
    
    if (!formData.reason || formData.reason === "Select a reason for booking an appointment with the SRO...") {
      toast.error("Please select a reason for your appointment");
      return;
    }
    
    if (!formData.mode || formData.mode === "") {
      toast.error("Please select a meeting mode (online or face-to-face)");
      return;
    }
    
    if (!formData.contact || formData.contact.length < 11) {
      toast.error("Please enter a valid contact number (11 digits)");
      return;
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Ensure contact number is exactly 10 digits (remove any non-digit characters)
      const formattedContact = formData.contact.replace(/\D/g, '').slice(-10);
      
      // Create appointment data that matches the database schema
      const appointmentData = {
        account_id: userAccountId, 
        reason: formData.reason, 
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        contact_number: formattedContact,
        email: formData.email,
        notes: formData.notes || "",
        other_reason: formData.reason === "Other" ? formData.notes : null,
        status: "scheduled",
        meeting_mode: formData.mode
      };
      
      console.log("Submitting final appointment data:", appointmentData);
      
      // Try a direct fetch approach
      try {
        // Get the JWT token from supabase
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          throw new Error("No authentication token found. Please login again.");
        }
        
        // Log all the details for debugging
        console.log("Supabase URL:", supabase.supabaseUrl);
        console.log("Token available:", !!token);
        console.log("API endpoint:", `${supabase.supabaseUrl}/rest/v1/appointments`);
        
        // Do a direct REST API call to the Supabase endpoint
        const response = await fetch(
          `${supabase.supabaseUrl}/rest/v1/appointments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': supabase.supabaseKey,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(appointmentData)
          }
        );
        
        const responseText = await response.text();
        console.log("Response status:", response.status);
        console.log("Response text:", responseText);
        
        if (!response.ok) {
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage += ` - ${JSON.stringify(errorData)}`;
          } catch (e) {
            errorMessage += ` - ${responseText}`;
          }
          throw new Error(errorMessage);
        }
        
        // Parse the response only if it contains JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Appointment created successfully:", data);
        } catch (e) {
          console.log("Response wasn't JSON, but appointment was created");
        }
        
        toast.success("Appointment booked successfully! You'll receive a confirmation email soon.");
      setSuccess(true);
      
      // Reset form
      setSelectedDate(null);
      setSelectedTime("");
      setFormData({
        reason: "",
        email: user?.email || "",
        contact: "",
        mode: "",
        notes: ""
      });
        
        // Reload appointments
        if (user && userAccountId) {
          loadUserAppointments(userAccountId);
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        toast.error(`Failed to book appointment: ${fetchError.message}`);
      }
      
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get day cell class - Improve contrast for readability
  const getDayClass = (day) => {
    let classes = "flex items-center justify-center rounded-full h-10 w-10 mx-auto ";
    
    // Check if this date has appointments
    const hasAppointments = datesWithAppointments.some(appointmentDate => 
      isSameDay(day, appointmentDate)
    );
    
    // First handle days not in current month
    if (!isSameMonth(day, currentMonth)) {
      classes += "text-gray-300 ";
    } 
    // Handle selected date
    else if (selectedDate && isSameDay(day, selectedDate)) {
      classes += "bg-[#007749] text-white font-bold ";
    } 
    // Handle today
    else if (isToday(day)) {
      classes += "border-2 border-[#007749] text-[#007749] font-bold ";
    } 
    // Handle available dates
    else if (isDateAvailable(day)) {
      if (hasAppointments) {
        classes += "text-blue-800 font-bold hover:text-blue-900 cursor-pointer ";
      } else {
        classes += "text-[#007749] font-bold hover:text-[#005a37] cursor-pointer ";
      }
    } 
    // Handle blocked dates (holidays, admin blocked)
    else if (blockedDates.some(blockedDate => isSameDay(day, blockedDate))) {
      classes += "text-[#7B1113] font-bold ";
    } 
    // Handle strictly unavailable dates (weekends, out of range)
    else {
      classes += "text-gray-600 ";
    }
    
    return classes;
  };

  // Get appointment status display
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'scheduled':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Scheduled</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  // Improved dummy data generation
  useEffect(() => {
    const setupData = async () => {
      // Generate sample data directly
      const today = new Date();
      
      // Generate 10 sample appointments
      const sampleAppointments = [];
      
      for (let i = 0; i < 10; i++) {
        // Add 1-10 days to today
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + Math.floor(Math.random() * 10) + 1);
        
        // Skip weekends
        while (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6) {
          appointmentDate.setDate(appointmentDate.getDate() + 1);
        }
        
        // Format date
        const dateStr = format(appointmentDate, 'yyyy-MM-dd');
        
        // Random time slot
        const hour = 9 + Math.floor(Math.random() * 8);
        if (hour === 12) continue; // Skip lunch hour
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        // Random status (mostly confirmed for visibility)
        const statuses = ['confirmed', 'confirmed', 'confirmed', 'pending', 'pending'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Get a random reason
        const reason = appointmentReasons[Math.floor(Math.random() * (appointmentReasons.length - 1)) + 1];
        
        // Get a random meeting mode
        const meetingMode = meetingModes[Math.floor(Math.random() * meetingModes.length)];
        
        // Create appointment with proper schema
        sampleAppointments.push({
          user_id: user?.account_id || 1,
          purpose: reason,
          date: dateStr,
          time_slot: timeSlot,
          email: user?.email || 'test@up.edu.ph',
          contact_number: '09123456789',
          meeting_mode: meetingMode,
          status: status,
          created_at: new Date().toISOString()
        });
      }
      
      console.log("Sample appointments prepared:", sampleAppointments);
      
      // Test database schema by retrieving a sample appointment first
      const { data: schemaCheck, error: schemaError } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);
        
      if (schemaError) {
        console.error("Error checking schema:", schemaError);
        throw new Error(`Schema check failed: ${schemaError.message}`);
      }
      
      // Log the schema for debugging
      console.log("Existing appointment schema:", schemaCheck);
      
      // Insert directly via Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert(sampleAppointments);
        
      if (error) {
        console.error("Error inserting sample data:", error);
        throw error;
      }
      
      toast.success("Sample appointments generated successfully!");
      
      // Reload appointments for the current month
      fetchMonthAppointments();
      
      // Reload user appointments if user is logged in
      if (user?.account_id) {
        loadUserAppointments(user.account_id);
      }
    };
    
    // Auto-generate test data on page load (remove in production)
    // Commenting out for now to prevent auto-generation
    // setupData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner className="h-8 w-8 text-[#7B1113]" />
        <span className="ml-2">Loading appointment options...</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4">
          <h2 className="text-xl font-semibold mb-2">
            {rescheduleMode ? "Appointment Reschedule Requested!" : 
             showCancelForm ? "Appointment Cancellation Requested!" : 
             "Appointment Request Submitted Successfully!"}
          </h2>
          <p className="mb-4">
            {rescheduleMode ? "Your reschedule request has been submitted and is pending approval. You will receive an email notification once it's processed." :
             showCancelForm ? "Your cancellation request has been submitted and is pending approval. You will receive an email notification once it's processed." :
             "Your appointment request has been submitted. An administrator will review your request and send you a confirmation email shortly. Your appointment is not finalized until you receive this confirmation email."}
          </p>
          <div className="flex gap-4">
            <button
              className="px-4 py-2 bg-[#7B1113] text-white rounded-md hover:bg-[#5e0d0e]"
              onClick={() => navigate("/")}
            >
              Return to Dashboard
            </button>
            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
              onClick={() => {
                setSuccess(false);
                setRescheduleMode(false);
                setShowCancelForm(false);
                setSelectedAppointment(null);
                setFormData({
                  reason: "",
                  email: user?.email || "",
                  contact: "",
                  date: null,
                  time: "",
                  mode: "",
                  notes: ""
                });
              }}
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {rescheduleMode ? "Reschedule Appointment" : 
           showCancelForm ? "Cancel Appointment" :
           "Book an Appointment"}
        </h1>
        
        {/* Toggle between booking and viewing appointments */}
        {!rescheduleMode && !showCancelForm && (
          <button 
            onClick={toggleAppointmentsView}
            className="px-4 py-2 bg-[#7B1113] text-white rounded-md hover:bg-[#5e0d0e] text-sm"
          >
            {showExistingAppointments ? "Book New Appointment" : "View My Appointments"}
          </button>
        )}
        
        {/* Back button for reschedule/cancel modes */}
        {(rescheduleMode || showCancelForm) && (
          <button 
            onClick={cancelRequestMode}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm flex items-center"
          >
            <ChevronLeft size={16} />
            <span>Back to Booking</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Show existing appointments */}
      {showExistingAppointments ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Appointments</h2>
          
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-[#7B1113]" />
              <span className="ml-2">Loading your appointments...</span>
            </div>
          ) : existingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>You don't have any upcoming appointments.</p>
              <button 
                onClick={toggleAppointmentsView}
                className="mt-4 px-4 py-2 bg-[#7B1113] text-white rounded-md hover:bg-[#5e0d0e] text-sm"
              >
                Book an Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {existingAppointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{appointment.reason}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock size={14} className="mr-1" />
                          <span>{appointment.appointment_time}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        {getStatusDisplay(appointment.status)}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex space-x-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <button 
                            onClick={() => requestReschedule(appointment)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                            title="Reschedule"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => showCancelRequest(appointment)}
                            className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : showCancelForm ? (
        // Cancellation form
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cancel Appointment</h2>
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <p className="font-medium">Appointment Details:</p>
            <p className="mt-2"><span className="font-medium">Date:</span> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
            <p><span className="font-medium">Time:</span> {selectedAppointment.time_slot}</p>
            <p><span className="font-medium">Purpose:</span> {selectedAppointment.purpose}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Reason for Cancellation *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 border rounded-md text-sm h-32"
              placeholder="Please provide a reason for cancelling this appointment..."
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={cancelRequestMode}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={submitCancellationRequest}
              disabled={!cancelReason || submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center">
                  <Spinner className="h-4 w-4 mr-2" />
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit Cancellation Request"
              )}
            </button>
          </div>
        </div>
      ) : (
        // Booking/Rescheduling form
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* Add an information box about the appointment confirmation process */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 mt-0.5 text-blue-500">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium mb-1">Appointment Confirmation Process</h4>
                  <p className="text-sm">
                    After submitting your appointment request, an administrator will review it and send you a confirmation email.
                    Your appointment is not finalized until you receive this confirmation.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Reason for Appointment</label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-sm"
                disabled={rescheduleMode}
              >
                {appointmentReasons.map((reason, index) => (
                  <option key={index} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Student/Organizational E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-sm"
                placeholder="firstmiddlelast@up.edu.ph"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Student/Organizational Contact No.</label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-sm"
                placeholder="09123456789"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Appointment Mode</label>
              <select
                name="mode"
                value={formData.mode}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">Select a meeting mode...</option>
                {meetingModes.map((mode, index) => (
                  <option key={index} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {rescheduleMode ? "Reason for Rescheduling (Optional)" : "Additional Notes (Optional)"}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-sm h-24"
                placeholder={rescheduleMode ? "Please provide a reason for rescheduling..." : "Add any additional information that might be helpful..."}
              ></textarea>
            </div>
          </div>
          
          {/* Right Column - Date and Time Selection */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {rescheduleMode ? "Select new date for your appointment" : "Select a date for your appointment"}
              </label>
              
              {/* Calendar Header */}
              <div className="mb-4 flex items-center justify-between">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-bold text-lg">
                  {format(currentMonth, 'MMMM yyyy').toUpperCase()}
                </h2>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              {/* Calendar Grid */}
              <div className="w-full">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2 text-center font-semibold">
                  <div className="text-sm">SUN</div>
                  <div className="text-sm">MON</div>
                  <div className="text-sm">TUE</div>
                  <div className="text-sm">WED</div>
                  <div className="text-sm">THU</div>
                  <div className="text-sm">FRI</div>
                  <div className="text-sm">SAT</div>
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Fill in empty slots for the first week */}
                  {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-10"></div>
                  ))}
                  
                  {/* Actual days */}
                  {generateCalendarDays().map((day, i) => (
                    <div 
                      key={i} 
                      onClick={() => isDateAvailable(day) && handleDateChange(day)}
                      className={getDayClass(day)}
                    >
                      {format(day, 'd')}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Calendar Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#007749] rounded-full mr-1"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 border border-[#007749] rounded-full mr-1"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 text-[#007749] mr-1 flex items-center justify-center font-bold">A</div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 text-[#7B1113] mr-1 flex items-center justify-center font-bold">B</div>
                  <span>Holiday/Blocked</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 text-gray-600 mr-1 flex items-center justify-center font-bold">U</div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 text-blue-800 mr-1 flex items-center justify-center font-bold">A</div>
                  <span>Has Appointments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Time slot selection */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Select Time Slot</label>
        {timeSlotLoading ? (
          <div className="text-center py-4">
            <span className="text-sm text-gray-600">Loading available time slots...</span>
          </div>
        ) : selectedDate ? (
          timeSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 px-3 text-sm font-medium rounded ${
                    selectedTime === time 
                      ? 'bg-[#007749] text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-sm text-red-600">No available time slots for this date</span>
            </div>
          )
        ) : (
          <div className="text-center py-4">
            <span className="text-sm text-gray-600">Please select a date first</span>
          </div>
        )}
      </div>
      
      {/* Book Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedDate || !selectedTime || !formData.reason || !formData.mode}
          className="bg-[#007749] text-white px-4 py-2 rounded-md hover:bg-[#006638] disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <div className="flex items-center">
              <Spinner className="h-4 w-4 mr-2" />
              <span>Processing...</span>
            </div>
          ) : rescheduleMode ? (
            "Submit Reschedule Request"
          ) : (
            "Book Appointment"
          )}
        </button>
      </div>
      
      {/* Admin-only utility button for seeding appointment data (would be removed in production) */}
      <div className="mt-8 border-t pt-4">
        <button
          onClick={async () => {
            alert("Generate sample data clicked");
            try {
              // Check if user is logged in
              if (!user || !user.account_id) {
                toast.error("Please log in to generate sample appointments");
                return;
              }
              
              // Generate sample data directly
              const today = new Date();
              
              // Generate 5 sample appointments
              const sampleAppointments = [];
              
              for (let i = 0; i < 5; i++) {
                // Add 1-10 days to today
                const appointmentDate = new Date(today);
                appointmentDate.setDate(today.getDate() + Math.floor(Math.random() * 10) + 1);
                
                // Skip weekends
                while (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6) {
                  appointmentDate.setDate(appointmentDate.getDate() + 1);
                }
                
                // Format date
                const dateStr = format(appointmentDate, 'yyyy-MM-dd');
                
                // Random time slot
                const hour = 9 + Math.floor(Math.random() * 8);
                if (hour === 12) continue; // Skip lunch hour
                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                
                // Get a random reason
                const reason = appointmentReasons[Math.floor(Math.random() * (appointmentReasons.length - 1)) + 1];
                
                // Create appointment with proper schema
                sampleAppointments.push({
                  account_id: user.account_id,
                  reason: reason,
                  appointment_date: dateStr,
                  appointment_time: timeSlot,
                  email: user.email || 'test@up.edu.ph',
                  contact_number: '1234567890', // Exactly 10 digits
                  notes: "Sample appointment generated for testing",
                  status: "scheduled"
                });
              }
              
              console.log("Sample appointments prepared:", sampleAppointments);
              
              if (sampleAppointments.length === 0) {
                toast.error("No sample appointments generated - check your logic");
                return;
              }
              
              // Try a direct fetch approach for sample data
              try {
                // Get the JWT token from supabase
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                
                if (!token) {
                  throw new Error("No authentication token found. Please login again.");
                }
                
                // Insert each appointment individually to avoid batch issues
                let successCount = 0;
                
                for (const appointment of sampleAppointments) {
                  // Do a direct REST API call to the Supabase endpoint
                  const response = await fetch(
                    `${supabase.supabaseUrl}/rest/v1/appointments`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'apikey': supabase.supabaseKey,
                        'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(appointment)
                    }
                  );
                  
                  if (response.ok) {
                    successCount++;
                  } else {
                    const errorData = await response.json();
                    console.error(`Failed to insert sample appointment: ${JSON.stringify(errorData)}`);
                  }
                }
                
                if (successCount > 0) {
                  toast.success(`Successfully created ${successCount} sample appointments!`);
              
              // Reload appointments for the current month
              fetchMonthAppointments();
              
              // Reload user appointments if user is logged in
              if (user?.account_id) {
                loadUserAppointments(user.account_id);
                  }
                } else {
                  toast.error("Failed to create any sample appointments");
                }
              } catch (fetchError) {
                console.error("Fetch error when creating sample data:", fetchError);
                toast.error(`Failed to generate sample data: ${fetchError.message}`);
              }
            } catch (error) {
              console.error("Error generating sample appointments:", error);
              toast.error("Failed to generate sample data: " + (error.message || "Unknown error"));
            }
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
        >
          Generate Sample Appointments (Testing Only)
        </button>
      </div>
    </div>
  );
};

export default AppointmentBooking; 