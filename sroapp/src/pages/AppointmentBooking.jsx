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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get account details from the account table
          const { data: accountData, error: accountError } = await supabase
            .from('account')
            .select('*')
            .eq('supabase_uid', user.id)
            .single();
          
          if (accountError) throw accountError;
          setUser(accountData);
          
          // Pre-fill email if available
          if (accountData?.email) {
            setFormData(prev => ({ ...prev, email: accountData.email }));
          }
          
          // Load user's appointments
          loadUserAppointments(accountData.account_id);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    
    getUser();
  }, []);

  // Load user's existing appointments
  const loadUserAppointments = async (userId) => {
    if (!userId) return;
    
    try {
      setLoadingAppointments(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'confirmed', 'reschedule-pending', 'cancellation-pending'])
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      setExistingAppointments(data || []);
      setLoadingAppointments(false);
    } catch (error) {
      console.error("Error loading user appointments:", error);
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
      
      // First check if there are settings with default time slots
      let defaultTimeSlots = [];
      
      // Get appointment settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (settingsError) {
        console.error("Error fetching settings:", settingsError);
      } else if (settingsData && settingsData.length > 0) {
        console.log("Settings found:", settingsData[0]);
        // If time_slots is defined in settings, use it
        if (settingsData[0].time_slots) {
          defaultTimeSlots = [...settingsData[0].time_slots];
        }
      }
      
      // If no settings or time_slots not defined, use default time slots
      if (defaultTimeSlots.length === 0) {
        defaultTimeSlots = [
          "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"
        ];
        console.log("Using default time slots:", defaultTimeSlots);
      }
      
      // Load existing appointments for the selected date to check availability
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', formattedDate);
      
      if (appointmentsError) {
        console.error("Error loading existing appointments:", appointmentsError);
        // Continue with default slots even if there's an error loading appointments
      }
      
      // Filter out slots that are already booked
      let availableSlots = [...defaultTimeSlots];
      
      if (existingAppointments && existingAppointments.length > 0) {
        console.log("Existing appointments:", existingAppointments);
        
        // Get all booked time slots (check both time_slot and time fields for compatibility)
        const bookedTimes = existingAppointments.map(appointment => {
          // Try to get the time slot from either time_slot or time field
          return appointment.time_slot || appointment.time || "";
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
        .select('date')
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .eq('status', 'confirmed');
      
      if (error) throw error;
      
      // Convert to date objects and store in state
      const dates = data.map(item => new Date(item.date));
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
      reason: appointment.purpose || appointment.reason || ""
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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}/reschedule-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_date: newDate,
          new_time_slot: formData.time,
          reason: formData.notes || "Reschedule requested by user"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit reschedule request");
      }
      
      // Success
      setSuccess(true);
      setSubmitting(false);
      setRescheduleMode(false);
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      setError(error.message || "Failed to submit reschedule request. Please try again later.");
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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}/cancellation-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit cancellation request");
      }
      
      // Success
      setSuccess(true);
      setSubmitting(false);
      setShowCancelForm(false);
    } catch (error) {
      console.error("Error requesting cancellation:", error);
      setError(error.message || "Failed to submit cancellation request. Please try again later.");
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
    
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }
    
    if (!formData.reason || formData.reason === "Select a reason for booking an appointment with the SRO...") {
      toast.error("Please select a reason for your appointment");
      return;
    }
    
    if (!formData.mode || formData.mode === "") {
      toast.error("Please select a meeting mode (online or face-to-face)");
      return;
    }
    
    try {
      setSubmitting(true);
      
      const appointmentData = {
        user_id: user.account_id, // Use account_id instead of id
        purpose: formData.reason, // Database expects 'purpose' not 'reason'
        date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedTime, // Use time_slot instead of time
        email: formData.email,
        contact_number: formData.contact,
        meeting_mode: formData.mode,
        notes: formData.notes || "",
        status: "pending",
        created_at: new Date().toISOString()
      };
      
      console.log("Submitting appointment data:", appointmentData);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData]);
      
      if (error) {
        console.error("Error submitting appointment:", error);
        toast.error(`Failed to book appointment: ${error.message}`);
        return;
      }
      
      toast.success("Appointment booked successfully! You'll receive a confirmation soon.");
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
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Confirmed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Cancelled</span>;
      case 'reschedule-pending':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Reschedule Pending</span>;
      case 'cancellation-pending':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Cancellation Pending</span>;
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
             "Appointment Booked Successfully!"}
          </h2>
          <p className="mb-4">
            {rescheduleMode ? "Your reschedule request has been submitted and is pending approval. You will receive an email notification once it's processed." :
             showCancelForm ? "Your cancellation request has been submitted and is pending approval. You will receive an email notification once it's processed." :
             "Your appointment request has been submitted. You will receive an email confirmation shortly."}
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
                      <h3 className="font-medium">{appointment.purpose}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock size={14} className="mr-1" />
                          <span>{appointment.time_slot}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        {getStatusDisplay(appointment.status)}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex space-x-2">
                      {appointment.status === 'confirmed' && (
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
                      {appointment.status === 'pending' && (
                        <span className="text-sm text-gray-500 italic">Awaiting confirmation</span>
                      )}
                      {appointment.status === 'reschedule-pending' && (
                        <span className="text-sm text-gray-500 italic">Reschedule request pending</span>
                      )}
                      {appointment.status === 'cancellation-pending' && (
                        <span className="text-sm text-gray-500 italic">Cancellation request pending</span>
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
            try {
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