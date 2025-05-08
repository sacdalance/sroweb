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
    email: "",
    contact: "",
    date: null,
    time: "",
    mode: "",
    notes: ""
  });
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
        // Get current user
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
          // Set default settings if none exist
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
        const { data: blockedDatesData, error: blockedDatesError } = await supabase
          .from('blocked_dates')
          .select('date');

        if (blockedDatesError) throw blockedDatesError;

        if (blockedDatesData) {
          const formattedBlockedDates = blockedDatesData.map(item => new Date(item.date));
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
        slots.push(current.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }));
        current = new Date(current.getTime() + interval * 60000);
      }

      // Get blocked slots
      const { data: blockedSlots } = await supabase
        .from('blocked_time_slots')
        .select('time_slot')
        .eq('date', formattedDate);

      // Get existing appointments
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', formattedDate)
        .in('status', ['scheduled', 'confirmed']);

      // Filter out blocked and booked slots
      const availableSlots = slots.filter(slot => {
        const isBlocked = blockedSlots?.some(blockedSlot => {
          const blockedTime = new Date(`2000-01-01T${blockedSlot.time_slot}`);
          return blockedTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }) === slot;
        });

        const isBooked = existingAppointments?.some(appointment => {
          const appointmentTime = new Date(`2000-01-01T${appointment.appointment_time}`);
          return appointmentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }) === slot;
        });

        return !isBlocked && !isBooked;
      });

      setTimeSlots(availableSlots);
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
        .in('status', ['scheduled', 'confirmed', 'reschedule-pending', 'cancellation-pending'])
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
    if (!selectedDate || !formData.time) {
      toast.error("Please select both date and time");
      return;
    }

    try {
      setSubmitting(true);

      const appointmentData = {
        account_id: userAccountId,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: formData.time,
        reason: formData.reason,
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
        email: "",
        contact: "",
        date: null,
        time: "",
        mode: "",
        notes: ""
      });
      setSelectedDate(null);
      setTimeSlots([]);

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

  // Handle cancel request
  const handleCancelRequest = async (appointmentId) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancellation-pending'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success("Cancellation request submitted");
      loadUserAppointments(userAccountId);
    } catch (error) {
      console.error("Error requesting cancellation:", error);
      toast.error("Failed to request cancellation");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#7B1113]">Book an Appointment</h1>
        {user && (
          <Button
            onClick={() => setShowExistingAppointments(true)}
            className="bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
          >
            My Appointments
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
              <p>You don&apos;t have any upcoming appointments.</p>
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
                <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold mb-2 text-[#7B1113]">Appointment Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Date:</span> {new Date(appointment.appointment_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Time:</span> {appointment.appointment_time}</p>
                    <p><span className="font-medium">Meeting Mode:</span> {appointment.meeting_mode || "Face-to-face"}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === "scheduled" ? "bg-yellow-100 text-yellow-700" :
                        appointment.status === "confirmed" ? "bg-green-100 text-green-700" :
                        appointment.status === "cancelled" ? "bg-red-100 text-red-700" :
                        appointment.status === "reschedule-pending" ? "bg-purple-100 text-purple-700" :
                        appointment.status === "cancellation-pending" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {appointment.status}
                      </span>
                    </p>
                    
                    {appointment.status === 'scheduled' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => {
                            setReschedulingAppointment(appointment);
                            setRescheduleData({ date: null, time: "" });
                            setRescheduleReason("");
                          }}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm"
                        >
                          Reschedule
                        </Button>
                        <Button
                          onClick={() => handleCancelRequest(appointment.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
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
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 mt-0.5 text-blue-500">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium mb-1">Important Information</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Appointments must be booked at least one day in advance</li>
                    <li>You can book appointments up to {settings?.advance_days || 14} days ahead</li>
                    <li>Available times are shown after selecting a date</li>
                    <li>Watch out for your email for confirmation</li>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="consultation">General Consultation</option>
                  <option value="document">Document Processing</option>
                  <option value="inquiry">General Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Meeting Mode
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select mode</option>
                  <option value="face-to-face">Face-to-face</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  required
                  pattern="^09\d{9}$"
                  title="Please enter a valid Philippine mobile number (e.g., 09123456789)"
                />
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
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setFormData(prev => ({ ...prev, time }))}
                        className={`py-2 px-3 text-sm font-medium rounded ${
                          formData.time === time 
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
                )}
              </div>
            )}

            <Button 
              type="submit"
              className="w-full bg-[#7B1113] hover:bg-[#5e0d0e] text-white"
              disabled={submitting || !selectedDate || !formData.time}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Please select a new date and time, and provide a reason for rescheduling.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setRescheduleData(prev => ({ ...prev, time }))}
                      className={`py-2 px-3 text-sm font-medium rounded ${
                        rescheduleData.time === time 
                          ? 'bg-[#007749] text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {time}
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
              variant="outline"
              onClick={() => {
                setReschedulingAppointment(null);
                setRescheduleData({ date: null, time: "" });
                setRescheduleReason("");
              }}
            >
              Cancel
            </Button>
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