import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/UserAuthContext";
import supabase from "../lib/supabase";
import { format, isToday, isPast } from "date-fns";
import { toast } from 'sonner';
import { ListSkeleton, CalendarSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Check, X, Info } from "lucide-react";
import CustomCalendar from "@/components/ui/custom-calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DataTable from "@/components/ui/DataTable";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import StatusPill from "@/components/ui/StatusPill";
import ActionButtons from "@/components/ui/ActionButtons";
import { appointmentSchema } from "@/lib/zodSchemas";
import { sanitizeInput } from "@/lib/utils";

const AppointmentBooking = () => {
  const { accountId, email } = useAuth();
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

  const validateField = (name, value) => {
    try {
      // Pick specific field from schema to validate
      appointmentSchema.pick({ [name]: true }).parse({ [name]: value });
      return "";
    } catch (error) {
      return error.errors[0]?.message || "Invalid input";
    }
  };

  // Handle form field changes with validation
  const handleFieldChange = (name, value, isMultiline = false) => {
    // Sanitize input if it's a string value
    const processedValue = typeof value === 'string' ? sanitizeInput(value, isMultiline) : value;

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    const error = validateField(name, processedValue);
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

  const [settings, setSettings] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [blockedDates, setBlockedDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeSlotLoading, setTimeSlotLoading] = useState(false);
  const [datesWithAppointments, setDatesWithAppointments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: null, time: "" });
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState("booking");
  const [lastBooking, setLastBooking] = useState(null); // For confirmation card

  // Load user appointments when accountId becomes available
  useEffect(() => {
    if (!accountId) return;
    loadUserAppointments(accountId);
  }, [accountId]);

  // Auto-fill email from auth context
  useEffect(() => {
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [email]);

  // Fetch initial data (settings and blocked dates)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
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
      } finally {
        setPageLoading(false);
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
    if (e) e.preventDefault();

    // Validate all fields using Zod
    const result = appointmentSchema.safeParse(formData);

    if (!result.success) {
      const newErrors = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    // Clear errors if valid
    setErrors({});

    if (!selectedDate || !formData.time) {
      toast.error("Please select both date and time");
      return;
    }

    try {
      setSubmitting(true);
      const appointmentData = {
        account_id: accountId,
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

      // Store booking details for confirmation card
      setLastBooking({
        date: format(selectedDate, 'MMMM d, yyyy'),
        time: formData.time,
        reason: formData.reason,
        subject: formData.subject,
        mode: formData.mode
      });

      // Reset form but keep email
      const userEmail = formData.email;
      setFormData({
        reason: "",
        subject: "",
        email: userEmail,
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
      if (accountId) {
        loadUserAppointments(accountId);
        // Switch to My Appointments tab to show the new booking
        setActiveTab("appointments");
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
      loadUserAppointments(accountId);
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      toast.error("Failed to request reschedule");
    }
  };

  // Column definitions for appointments table
  const appointmentColumns = useMemo(() => [
    {
      key: "reason",
      header: "Reason",
      width: "w-[18%]",
      sortable: true,
      render: (row) => (
        <span className="break-words whitespace-normal md:truncate block text-gray-700 font-medium capitalize" title={row.reason || "Not Specified"}>
          {row.reason || "Not Specified"}
        </span>
      ),
    },
    {
      key: "specified_reason",
      header: "Subject",
      width: "w-[22%]",
      sortable: true,
      render: (row) => (
        <span className="break-words whitespace-normal md:truncate block text-gray-600" title={row.specified_reason || "No Specified Reason"}>
          {row.specified_reason || "No Specified Reason"}
        </span>
      ),
    },
    {
      key: "appointment_date",
      header: "Date",
      width: "w-[12%]",
      sortable: true,
      sortAccessor: (row) => row.appointment_date,
      render: (row) => (
        <span className="text-gray-600">
          {new Date(row.appointment_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "appointment_time",
      header: "Time",
      width: "w-[10%]",
      sortable: true,
      render: (row) => (
        <span className="text-gray-600">
          {new Date(`2000-01-01T${row.appointment_time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </span>
      ),
    },
    {
      key: "meeting_mode",
      header: "Mode",
      width: "w-[10%]",
      sortable: true,
      render: (row) => (
        <span className="text-gray-600 capitalize">
          {row.meeting_mode || "Face-to-face"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[13%]",
      sortable: true,
      isStatus: true,
      accessor: (row) => row.status || "scheduled",
      render: (row) => {
        const statusTooltips = {
          'scheduled': 'Awaiting confirmation from the SRO.',
          'confirmed': 'Confirmed by the SRO. Please arrive on time.',
          'reschedule-pending': 'Your reschedule request is pending SRO approval.',
          'cancelled': 'This appointment has been cancelled.',
          'completed': 'This appointment has been completed.'
        };
        const status = row.status || 'scheduled';
        return (
          <div title={statusTooltips[status] || 'Status information'}>
            <StatusPill status={status} />
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[15%]",
      render: (row) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setReschedulingAppointment(row);
            setRescheduleData({ date: null, time: "" });
            setRescheduleReason("");
          }}
          disabled={row.status !== 'scheduled'}
          size="sm"
          className={`text-xs ${row.status === 'scheduled'
            ? ''
            : 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
            }`}
          variant={row.status === 'scheduled' ? 'sro-primary' : 'ghost'}
        >
          Reschedule
        </Button>
      ),
    },
  ], []);

  if (pageLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Appointments</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="booking">Book Appointment</TabsTrigger>
          <TabsTrigger value="appointments">My Appointments</TabsTrigger>
        </TabsList>

        {/* My Appointments Tab */}
        <TabsContent value="appointments">
          {/* Confirmation Card after booking */}
          {lastBooking && (
            <div className="bg-sro-secondary/10 border border-sro-secondary/30 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-sro-secondary/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="w-5 h-5 text-sro-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sro-secondary">Appointment Confirmed!</h3>
                    <p className="text-sm text-sro-secondary/80 mt-1">
                      <strong>{lastBooking.reason}</strong> — {lastBooking.subject}
                    </p>
                    <p className="text-sm text-sro-secondary/80">
                      {lastBooking.date} at {lastBooking.time} ({lastBooking.mode === 'online' ? 'Online' : 'Face-to-face'})
                    </p>
                    <p className="text-xs text-sro-secondary/70 mt-2">
                      You'll receive an email confirmation once approved by the SRO.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLastBooking(null)}
                  className="text-sro-secondary/60 hover:text-sro-secondary p-1"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <ListSkeleton rows={4} />
          ) : (
            <>
              <DataTable
                columns={appointmentColumns}
                data={existingAppointments.map(apt => ({ ...apt, id: apt.id }))}
                emptyMessage="You don't have any upcoming appointments."
              />

              {/* Cancellation Policy Note */}
              <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Need to cancel?</strong> Appointments are final. Please contact the SRO via email if you need to cancel.
                </span>
              </div>
            </>
          )}
        </TabsContent>

        {/* Book Appointment Tab */}
        <TabsContent value="booking">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-6">
              <div className="bg-sro-secondary/10 border border-sro-secondary/20 text-sro-secondary rounded-md p-4 mb-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 mr-2 mt-0.5 text-sro-secondary" />
                  <div>
                    <p className="font-medium mb-1 text-sro-secondary">Important Information</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-sro-secondary/90">
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
                    Reason for Visit <span className="text-red-500">*</span>
                  </label>
                  <UnifiedDropdown
                    options={[
                      { value: "Consultation", label: "Consultation" },
                      { value: "Document Processing", label: "Document Processing" },
                      { value: "Org Recognition Interview", label: "Org Recognition Interview" },
                      { value: "Other", label: "Other" }
                    ]}
                    value={formData.reason}
                    onChange={(val) => handleFieldChange("reason", val)}
                    placeholder="Select a reason"
                    error={!!errors.reason}
                  />
                  {errors.reason && (
                    <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{errors.reason}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => handleFieldChange("subject", e.target.value)}
                    className={errors.subject ? 'border-sro-primary bg-red-50' : ''}
                    placeholder="Specify the reason for visit..."
                  />
                  {errors.subject && (
                    <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meeting Mode <span className="text-red-500">*</span>
                  </label>
                  <UnifiedDropdown
                    options={[
                      { value: "face-to-face", label: "Face-to-face" },
                      { value: "online", label: "Online" }
                    ]}
                    value={formData.mode}
                    onChange={(val) => handleFieldChange("mode", val)}
                    placeholder="Select mode"
                    error={!!errors.mode}
                  />
                  {errors.mode && (
                    <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{errors.mode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className={errors.email ? 'border-sro-primary bg-red-50' : ''}
                    placeholder="delpilarmh@up.edu.ph"
                  />
                  {errors.email && (
                    <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    name="contact"
                    inputMode="numeric"
                    value={formData.contact}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 11) {
                        handleFieldChange("contact", value);
                      }
                    }}
                    className={errors.contact ? 'border-sro-primary bg-red-50' : ''}
                    placeholder="09XXXXXXXXX"
                    maxLength="11"
                  />
                  {errors.contact && (
                    <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{errors.contact}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Format: 09XXXXXXXXX (11 digits)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Notes
                  </label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => handleFieldChange("notes", e.target.value, true)}
                    className="min-h-[100px]"
                    placeholder="Please indicate your Organization (if applicable) and any extra information..."
                  />
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div>
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

                <div className="flex flex-wrap gap-x-2 md:gap-x-4 gap-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-sro-secondary"></span>
                    <span className="text-xs text-sro-secondary font-medium">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-sro-secondary"></span>
                    <span className="text-xs text-sro-secondary font-medium">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-sro-secondary/20 border border-sro-secondary/40"></span>
                    <span className="text-xs text-sro-secondary font-medium">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-sro-primary/10 border border-sro-primary"></span>
                    <span className="text-xs text-sro-primary font-medium">Blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-gray-200 border border-gray-400"></span>
                    <span className="text-xs text-gray-600 font-medium">Unavailable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-amber-100 border border-amber-400"></span>
                    <span className="text-xs text-amber-700 font-medium">Has Appointments</span>
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                  {timeSlotLoading ? (
                    <div className="text-center py-4">
                      <span className="text-sm text-gray-600">Loading available time slots...</span>
                    </div>
                  ) : timeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setFormData(prev => ({ ...prev, time: slot.time }))}
                          className={`py-3 sm:py-2 px-3 text-sm font-medium rounded min-h-[44px] ${formData.time === slot.time
                            ? 'bg-sro-secondary text-white'
                            : slot.booked
                              ? 'bg-sro-primary text-white cursor-not-allowed'
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

              <div className="flex justify-end pt-4">
                <ActionButtons
                  confirmLabel="Book Appointment"
                  confirmVariant="secondary"
                  onConfirm={handleSubmit}
                  isLoading={submitting}
                  disabled={submitting || !isFormValid()}
                  className="w-full md:w-auto"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => !open && setReschedulingAppointment(null)}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setRescheduleData(prev => ({ ...prev, time: slot.time }))}
                      className={`py-2 px-3 text-sm font-medium rounded ${rescheduleData.time === slot.time
                        ? 'bg-sro-secondary text-white'
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
              variant="sro-primary"
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