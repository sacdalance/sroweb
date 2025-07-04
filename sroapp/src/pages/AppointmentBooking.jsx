import { useState, useEffect } from "react";
import supabase from "../lib/supabase";
import { format, isToday, isPast } from "date-fns";
import { toast } from 'sonner';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import CustomCalendar from "@/components/ui/custom-calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const AppointmentBooking = () => {
  const [formData, setFormData] = useState({
    reason: "",
    subject: "",
    email: "",
    contact: "",
    date: null,
    time: "",
    mode: "",
    notes: ""
  });
  
  const [errors, setErrors] = useState({
    email: "",
    contact: "",
    reason: "",
    subject: "",
    mode: ""
  });

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateContact = (contact) => {
    const contactRegex = /^09[0-9]{9}$/;
    if (!contact) return "Contact number is required";
    if (!contactRegex.test(contact)) return "Please enter a valid Philippine mobile number (e.g., 09123456789)";
    return "";
  };

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        return validateEmail(value);
      case "contact":
        return validateContact(value);
      case "reason":
        return !value ? "Please select a reason" : "";
      case "subject":
        return !value ? "Subject is required" : "";
      case "mode":
        return !value ? "Please select a meeting mode" : "";
      default:
        return "";
    }
  };

  // Handle form field changes with validation
  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      !Object.values(errors).some(error => error) && // no validation errors
      Object.keys(errors).every(field => formData[field]) && // all required fields filled
      formData.date && 
      formData.time
    );
  };

  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExistingAppointments, setShowExistingAppointments] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userAccountId, setUserAccountId] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeSlotLoading, setTimeSlotLoading] = useState(false);
  const [datesWithAppointments, setDatesWithAppointments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: null, time: "" });
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);

          // Get user's account details
          const { data: accountData, error: accountError } = await supabase
            .from('account')
            .select('account_id')
            .eq('email', currentUser.email)
            .single();

          if (accountError) throw accountError;
          
          if (accountData?.account_id) {
            setUserAccountId(accountData.account_id);
            await loadUserAppointments(accountData.account_id);
          }
        }

        // Get appointment settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('appointment_settings')
          .select('*')
          .limit(1)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        if (!settingsData) {
          setSettings({
            start_time: '08:00',
            end_time: '16:00',
            interval_minutes: 30,
            allowed_days: [1, 2, 3, 4, 5],
            advance_days: 14
          });
        } else {
          setSettings(settingsData);
        }

        // Get blocked dates
        const { data: blockedSlotsData, error: blockedSlotsError } = await supabase
          .from('blocked_slots')
          .select('block_date')
          .not('block_date', 'is', null);

        if (blockedSlotsError) throw blockedSlotsError;

        if (blockedSlotsData) {
          const formattedBlockedDates = blockedSlotsData.map(item => new Date(item.block_date));
          setBlockedDates(formattedBlockedDates);
        }

      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load settings");
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadAppointmentDates = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_date')
          .in('status', ['scheduled', 'confirmed'])
          .order('appointment_date');

        if (error) throw error;
        
        if (data) {
          const dates = [...new Set(data.map(item => item.appointment_date))];
          setDatesWithAppointments(dates.map(date => new Date(date)));
        }
      } catch (error) {
        console.error('Error loading appointment dates:', error);
      }
    };

    loadAppointmentDates();
  }, []);

  // Load time slots for a selected date
  const loadTimeSlots = async (date) => {
    try {
      setTimeSlotLoading(true);
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { startTime, endTime, interval } = {
        startTime: settings?.start_time || '08:00',
        endTime: settings?.end_time || '16:00',
        interval: settings?.interval_minutes || 30
      };

      // Generate time slots
      const slots = [];
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      let current = new Date(start);
      while (current < end) {
        slots.push({
          time: current.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }),
          available: true
        });
        current = new Date(current.getTime() + interval * 60000);
      }

      // Get blocked time slots and specific date blocks
      const { data: blockedSlots, error: blockedError } = await supabase
        .from('blocked_slots')
        .select('*')
        .or(`block_date.eq.${formattedDate},block_time.not.is.null`);

      if (blockedError) throw blockedError;

      // Get existing appointments
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', formattedDate)
        .in('status', ['scheduled', 'confirmed']);

      if (appointmentsError) throw appointmentsError;

      // Process slots with blocked and booked information
      const processedSlots = slots.map(slot => {
        // Check if slot is blocked (either by time or date)
        const isBlocked = blockedSlots?.some(blockedSlot => {
          if (blockedSlot.block_date === formattedDate) return true;
          
          if (blockedSlot.block_time) {
            const blockedTime = new Date(`2000-01-01T${blockedSlot.block_time}`);
            return blockedTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            }) === slot.time;
          }
          
          return false;
        });

        // Check if slot is booked
        const isBooked = existingAppointments?.some(appointment => {
          const appointmentTime = new Date(`2000-01-01T${appointment.appointment_time}`);
          return appointmentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }) === slot.time;
        });

        return {
          ...slot,
          available: !isBlocked && !isBooked,
          booked: isBooked,
          blocked: isBlocked
        };
      });

      setTimeSlots(processedSlots);
    } catch (error) {
      console.error("Error loading time slots:", error);
      toast.error("Failed to load available time slots");
      setTimeSlots([]);
    } finally {
      setTimeSlotLoading(false);
    }
  };

  // Check if date is allowed for booking
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
    const dayOfWeek = date.getDay();
    
    // Calculate the maximum allowed date (default 14 business days)
    const advanceDays = settings?.advance_days || 14;
    let businessDaysAhead = 0;
    let maxDate = new Date(today);
    
    while (businessDaysAhead < advanceDays) {
      maxDate.setDate(maxDate.getDate() + 1);
      const dayOfWeek = maxDate.getDay();
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
    if (blockedDates.some(blockedDate => 
      blockedDate.getFullYear() === date.getFullYear() &&
      blockedDate.getMonth() === date.getMonth() &&
      blockedDate.getDate() === date.getDate()
    )) {
      return false;
    }
    
    return true;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      loadTimeSlots(date);
      setFormData(prev => ({ ...prev, date: date }));
    } else {
      toast.error("This date is not available for booking");
    }
  };

  // Add loadUserAppointments function
  const loadUserAppointments = async (accountId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('account_id', accountId)
        .in('status', ['scheduled', 'confirmed', 'reschedule-pending'])
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setExistingAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load your appointments');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields first
    const newErrors = {
      email: validateField("email", formData.email),
      contact: validateField("contact", formData.contact),
      reason: validateField("reason", formData.reason),
      subject: validateField("subject", formData.subject),
      mode: validateField("mode", formData.mode)
    };
    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!selectedDate || !formData.time) {
      toast.error("Please select both date and time");
      return;
    }

    try {
      setSubmitting(true);      const appointmentData = {
        account_id: userAccountId,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: formData.time,
        reason: formData.reason,
        specified_reason: formData.subject,
        notes: formData.notes,
        meeting_mode: formData.mode,
        contact_number: formData.contact,
        email: formData.email,
        status: 'scheduled'
      };

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (appointmentError) throw appointmentError;

      toast.success("Appointment booked successfully!");
      
      // Reset form
      setFormData({
        reason: "",
        subject: "",
        email: "",
        contact: "",
        date: null,
        time: "",
        mode: "",
        notes: ""
      });
      setSelectedDate(null);
      setTimeSlots([]);
      setErrors({
        email: "",
        contact: "",
        reason: "",
        subject: "",
        mode: ""
      });

      // Refresh appointments list if user is logged in
      if (user && userAccountId) {
        loadUserAppointments(userAccountId);
        setShowExistingAppointments(true);
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reschedule request
  const handleRescheduleRequest = async (appointmentId) => {
    if (!rescheduleData.date || !rescheduleData.time || !rescheduleReason.trim()) {
      toast.error("Please select date, time and provide a reason");
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          requested_date: format(rescheduleData.date, 'yyyy-MM-dd'),
          requested_time_slot: rescheduleData.time,
          reschedule_reason: rescheduleReason,
          status: 'reschedule-pending'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success("Reschedule request submitted");
      setReschedulingAppointment(null);
      setRescheduleData({ date: null, time: "" });
      setRescheduleReason("");
      loadUserAppointments(userAccountId);
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      toast.error("Failed to request reschedule");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#7B1113]">
          {showExistingAppointments ? "My Appointments" : "Book an Appointment"}
        </h1>
        {user && (
          <Button
            onClick={() => setShowExistingAppointments(!showExistingAppointments)}
            className="bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
          >
            {showExistingAppointments ? "← Back" : "My Appointments"}
          </Button>
        )}
      </div>

      {showExistingAppointments ? (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8 text-[#7B1113]" />
              <span className="ml-2">Loading your appointments...</span>
            </div>
          ) : existingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>You don't have any upcoming appointments.</p>
              <Button 
                onClick={() => setShowExistingAppointments(false)}
                className="mt-4 bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
              >
                Book an Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {existingAppointments.map((appointment) => (
                <Card key={appointment.id} className="shadow-sm">
                  <CardContent className="py-2 px-4">
                    <div className="flex justify-between items-center gap-4">
                      <div className="py-0.5">
                        <h3 className="font-medium text-[#7B1113] capitalize">
                          {appointment.reason || "Not Specified"}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                          <span className="mx-2">|</span>
                          <span>
                            {new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                          <span className="mx-2">|</span>
                          <span>{appointment.meeting_mode || "Face-to-face"}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {appointment.specified_reason || "No Specified Reason"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          appointment.status === "scheduled" ? "bg-amber-100 text-amber-700" :
                          appointment.status === "confirmed" ? "bg-[#014421]/20 text-[#014421]" :
                          appointment.status === "cancelled" ? "bg-red-100 text-red-700" :
                          appointment.status === "reschedule-pending" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {appointment.status}
                        </span>
                        <Button
                          onClick={() => {
                            setReschedulingAppointment(appointment);
                            setRescheduleData({ date: null, time: "" });
                            setRescheduleReason("");
                          }}
                          disabled={appointment.status !== 'scheduled'}
                          size="sm"
                          className={`text-xs ${
                            appointment.status === 'scheduled'
                              ? 'bg-[#7b1113] hover:bg-[#5e0d0e] text-white'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                          }`}
                        >
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                onClick={() => setShowExistingAppointments(false)}
                className="w-full bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
              >
                Book Another Appointment
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-[#014421]/10 border border-[#014421]/20 text-[#014421] rounded-md p-4 mb-6">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 mt-0.5 text-[#014421]">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium mb-1 text-[#014421]">Important Information</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-[#014421]/90">
                    <li>Appointments must be booked at least one day in advance.</li>
                    <li>You can book appointments up to {settings?.advance_days || 14} days ahead.</li>
                    <li>Available times are shown after selecting a date.</li>
                    <li>Your booking will be confirmed by the SRO via E-mail.</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for Visit
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={(e) => handleFieldChange("reason", e.target.value)}
                  className={`w-full p-2 border rounded-md ${
                    errors.reason ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#014421] focus:border-[#014421]'
                  }`}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Document Processing">Document Processing</option>
                  <option value="Org Recognition Interview">Org Recognition Interview</option>
                  <option value="Other">Other</option>
                </select>
                {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => handleFieldChange("subject", e.target.value)}
                  className={`w-full p-2 border rounded-md ${
                    errors.subject ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#014421] focus:border-[#014421]'
                  }`}
                  placeholder="Specify the reason for visit..."
                  required
                />
                {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Meeting Mode
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={(e) => handleFieldChange("mode", e.target.value)}
                  className={`w-full p-2 border rounded-md ${
                    errors.mode ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#014421] focus:border-[#014421]'
                  }`}
                  required
                >
                  <option value="">Select mode</option>
                  <option value="face-to-face">Face-to-face</option>
                  <option value="online">Online</option>
                </select>
                {errors.mode && <p className="mt-1 text-xs text-red-500">{errors.mode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className={`w-full p-2 border rounded-md ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#014421] focus:border-[#014421]'
                  }`}
                  placeholder="delpilarmh@up.edu.ph"
                  required
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Number
                </label>
                <div className="space-y-1">
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 11) {
                        handleFieldChange("contact", value);
                      }
                    }}
                    className={`w-full p-2 border rounded-md ${
                      errors.contact ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#014421] focus:border-[#014421]'
                    }`}
                    placeholder="(09XXXXXXXXX)"
                    maxLength="11"
                    required
                  />
                  {errors.contact && <p className="mt-1 text-xs text-red-500">{errors.contact}</p>}
                  <p className="text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border rounded-md text-sm h-24"
                  placeholder="Add any additional information that might be helpful..."
                ></textarea>
              </div>
            </form>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <CustomCalendar
                  mode="appointments"
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onMonthChange={setCurrentMonth}
                  blockedDates={blockedDates}
                  datesWithAppointments={datesWithAppointments}
                  isDateAvailable={isDateAvailable}
                />

                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#014421] rounded-full mr-1"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 border-2 border-[#014421] rounded-full mr-1"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#014421]/20 mr-1 flex items-center justify-center font-bold text-[#014421]">A</div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 text-[#7B1113] mr-1 flex items-center justify-center font-bold">B</div>
                    <span>Blocked</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 text-gray-600 mr-1 flex items-center justify-center font-bold">U</div>
                    <span>Unavailable</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-100 text-amber-700 mr-1 flex items-center justify-center font-bold">A</div>
                    <span>Has Appointments</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedDate && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                {timeSlotLoading ? (
                  <div className="text-center py-4">
                    <span className="text-sm text-gray-600">Loading available time slots...</span>
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setFormData(prev => ({ ...prev, time: slot.time }))}
                        className={`py-2 px-3 text-sm font-medium rounded ${
                          formData.time === slot.time 
                            ? 'bg-[#014421] text-white' 
                            : slot.booked
                            ? 'bg-[#7B1113] text-white cursor-not-allowed'
                            : slot.blocked
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        disabled={!slot.available}
                      >
                        {slot.time}
                        {slot.booked && <span className="block text-xs">(Booked)</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="text-sm text-red-600">No time slots available for this date</span>
                  </div>
                )}
              </div>
            )}

            <Button 
              type="submit"
              className={`w-full text-white ${
                isFormValid() 
                  ? 'bg-[#7B1113] hover:bg-[#5e0d0e]' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={submitting || !isFormValid()}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Booking Appointment...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </div>
        </div>
      )}
      <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => !open && setReschedulingAppointment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Please select a new date and time, and provide a reason for rescheduling.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="rounded-lg border p-4">
              <CustomCalendar
                mode="appointments"
                currentMonth={currentMonth}
                selectedDate={rescheduleData.date}
                onDateSelect={(date) => {
                  setRescheduleData(prev => ({ ...prev, date }));
                  loadTimeSlots(date);
                }}
                onMonthChange={setCurrentMonth}
                blockedDates={blockedDates}
                datesWithAppointments={datesWithAppointments}
                isDateAvailable={isDateAvailable}
              />
            </div>

            {rescheduleData.date && (
              <div>
                <label className="block text-sm font-medium mb-2">Select New Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setRescheduleData(prev => ({ ...prev, time: slot.time }))}
                      className={`py-2 px-3 text-sm font-medium rounded ${
                        rescheduleData.time === slot.time 
                          ? 'bg-[#014421] text-white' 
                          : slot.available
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!slot.available}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Reason for Rescheduling</label>
              <Textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Please provide a reason for rescheduling..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => handleRescheduleRequest(reschedulingAppointment.id)}
              className="bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
              disabled={!rescheduleData.date || !rescheduleData.time || !rescheduleReason.trim()}
            >
              Request Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentBooking;