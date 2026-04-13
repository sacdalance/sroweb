import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import supabase from "../../lib/supabase";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { SettingsSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import DataTable from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import CalendarWithSidePanel from "@/components/ui/CalendarWithSidePanel";
import { isSameDay, format, parseISO } from "date-fns";
import ActionButtons from "@/components/ui/ActionButtons";
import { Save, AlertTriangle, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// Sub-components
import ConsultationHoursSettings from "@/components/admin/appointments/ConsultationHoursSettings";
import BlockedDatesSettings from "@/components/admin/appointments/BlockedDatesSettings";
import TimeSlotsSettings from "@/components/admin/appointments/TimeSlotsSettings";

const AdminAppointmentSettings = () => {
  // Settings State
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [interval, setInterval] = useState(30);

  // Blocking State
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState([]);

  // Initial State for Diffing (to optimize saves)
  const [initialBlockedDates, setInitialBlockedDates] = useState([]);
  const [initialBlockedTimeSlots, setInitialBlockedTimeSlots] = useState([]);

  // Unsaved Changes State
  const [activeTab, setActiveTab] = useState("requests");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // Initial Settings State for Diffing
  const [initialStartTime, setInitialStartTime] = useState("09:00");
  const [initialEndTime, setInitialEndTime] = useState("17:00");
  const [initialInterval, setInitialInterval] = useState(30);

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Appointment Data State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [actionType, setActionType] = useState('reject');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [showRequests, setShowRequests] = useState(false);

  // --- Data Loading ---

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Get Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('start_time, end_time, interval_minutes')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settingsData) {
        setStartTime(settingsData.start_time.slice(0, 5));
        setEndTime(settingsData.end_time.slice(0, 5));
        setInterval(settingsData.interval_minutes);

        setInitialStartTime(settingsData.start_time.slice(0, 5));
        setInitialEndTime(settingsData.end_time.slice(0, 5));
        setInitialInterval(settingsData.interval_minutes);
      }

      // 2. Get Blocked Slots
      const { data: blockedSlotsData, error: blockedSlotsError } = await supabase
        .from('blocked_slots')
        .select('block_date, block_time');

      if (blockedSlotsError) throw blockedSlotsError;

      const todayStr = new Date().toISOString().split('T')[0];

      // Filter active dates and identify past ones for cleanup
      const activeBlockedDates = [];
      const pastBlockedDateIds = [];

      blockedSlotsData.forEach(slot => {
        if (slot.block_date) {
          if (slot.block_date < todayStr) {
            pastBlockedDateIds.push(slot.block_date); // Assuming block_date is unique enough or use ID if available. 
            // Actually, delete needs a condition. using block_date is fine if we assume uniqueness per day or just delete all matching.
          } else {
            activeBlockedDates.push(slot.block_date);
          }
        }
      });

      // Async cleanup past dates (fire and forget or await)
      if (pastBlockedDateIds.length > 0) {
        supabase.from('blocked_slots').delete().in('block_date', pastBlockedDateIds);
      }

      const times = blockedSlotsData
        .filter(slot => slot.block_time)
        .map(slot => {
          // Convert HH:mm:ss to HH:MM AM/PM
          const time = new Date(`2000-01-01T${slot.block_time}`);
          return time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        });

      setBlockedDates(activeBlockedDates);
      setBlockedTimeSlots(times);

      // Store initial state for diffing
      setInitialBlockedDates(activeBlockedDates);
      setInitialBlockedTimeSlots(times);

      setLoading(false);

      // Load appointments after settings are ready (implied dependency)
      loadAppointments(settingsData?.interval_minutes || 30);

    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings.");
      setLoading(false);
    }
  };

  const loadAppointments = async (currentInterval = 30) => {
    try {
      setLoadingAppointments(true);
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Find and auto-reject expired appointments server-side
      const { data: expiredAppointments } = await supabase
        .from('appointments')
        .select('id, appointment_date, account:account(email)')
        .in('status', ['scheduled', 'reschedule-pending'])
        .lt('appointment_date', todayStr);

      if (expiredAppointments?.length > 0) {
        const expiredIds = expiredAppointments.map(app => app.id);
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            status: 'rejected',
            admin_notes: "Date has elapsed without confirmation from SRO. Please rebook or contact the office if you have any inquiries.",
            updated_at: new Date().toISOString()
          })
          .in('id', expiredIds);

        if (updateError) {
          console.error("Auto-reject update failed", updateError);
        } else {
          // Send expiry emails (fire-and-forget)
          Promise.all(expiredAppointments.map(app =>
            authFetch(`${API_BASE_URL}/api/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: app.account?.email,
                subject: "Appointment Expired - SRO",
                html: `<p>Your appointment on <strong>${app.appointment_date}</strong> has expired and been automatically rejected.</p><p>Reason: Date has elapsed without confirmation from SRO. Please rebook or contact the office if you have any inquiries.</p>`
              })
            }).catch(e => console.error("Failed to send expiry email", e))
          ));
          toast.info(`Auto-rejected ${expiredAppointments.length} elapsed appointment(s).`);
        }
      }

      // 2. Fetch all appointments (now with expired ones already updated)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          account:account(account_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const formattedAppointments = data.map(appointment => {
        const start = new Date(`2000-01-01T${appointment.appointment_time}`);
        const end = new Date(start.getTime() + currentInterval * 60000);

        const timeRange = `${start.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })} - ${end.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`;

        const fullName = appointment.account?.account_name || '';
        const [lastName, ...firstNames] = fullName.split(',').map(part => part.trim());
        const formattedName = lastName && firstNames.length
          ? `${lastName.toUpperCase()}, ${firstNames.join(' ')}`
          : fullName;

        return {
          ...appointment,
          timeRange,
          formattedName,
          fullDetails: `${appointment.reason}${appointment.notes ? ` - ${appointment.notes}` : ''}`,
          date: new Date(appointment.appointment_date),
          title: formattedName || 'Appointment',
          requestedDate: appointment.requested_date ? new Date(appointment.requested_date) : null,
          requestedTime: appointment.requested_time_slot ? new Date(`2000-01-01T${appointment.requested_time_slot}`).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
          }) : null,
        };
      });

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoadingAppointments(false);
    }
  };

  // --- Logic Helpers ---

  const generateTimeSlots = () => {
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
    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(), [startTime, endTime, interval]);

  const convertToDBTime = (timeStr) => {
    // "10:00 AM" -> "10:00:00"
    let hours = parseInt(timeStr.match(/^(\d+)/)[1]);
    const minutes = parseInt(timeStr.match(/:(\d+)/)[1]);
    const period = timeStr.match(/([AP]M)$/)[1];
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  // --- Handlers (Settings) ---

  const handleToggleDate = (dateString) => {
    if (blockedDates.includes(dateString)) {
      setBlockedDates(blockedDates.filter(d => d !== dateString));
    } else {
      setBlockedDates([...blockedDates, dateString]);
    }
  };

  const handleAddBlockedDates = (newDates) => {
    // Filter out duplicates that are already blocked
    const uniqueNew = newDates.filter(d => !blockedDates.includes(d));
    if (uniqueNew.length > 0) {
      setBlockedDates([...blockedDates, ...uniqueNew]);
    }
  };

  const handleToggleTimeSlot = (slot) => {
    if (blockedTimeSlots.includes(slot)) {
      setBlockedTimeSlots(blockedTimeSlots.filter(s => s !== slot));
    } else {
      setBlockedTimeSlots([...blockedTimeSlots, slot]);
    }
  };

  const handleBlockAllSlots = () => setBlockedTimeSlots(timeSlots);
  const handleUnblockAllSlots = () => setBlockedTimeSlots([]);

  const handleBlockLunch = () => {
    const lunchSlots = timeSlots.filter(slot => {
      // Simple parse to check if hour is 12 and it's PM
      return slot.startsWith("12:") && slot.includes("PM");
    });
    setBlockedTimeSlots(prev => [...new Set([...prev, ...lunchSlots])]);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // 1. Save Base Settings
      const { error: settingsError } = await supabase
        .from('appointment_settings')
        .upsert({
          id: 1,
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          interval_minutes: interval
        });
      if (settingsError) throw settingsError;

      // 2. Sync Blocked Dates
      const datesToAdd = blockedDates.filter(d => !initialBlockedDates.includes(d));
      const datesToRemove = initialBlockedDates.filter(d => !blockedDates.includes(d));

      if (datesToAdd.length > 0) {
        await supabase.from('blocked_slots').insert(datesToAdd.map(d => ({ block_date: d })));

        // --- Auto-Cancel/Reject Conflicts ---
        // Find appointments that fall on the newly blocked dates
        // Ensure dates are strings for comparison
        const conflictingAppointments = appointments.filter(app =>
          datesToAdd.includes(app.appointment_date.trim()) &&
          ['scheduled', 'confirmed', 'reschedule-pending'].includes(app.status)
        );

        if (conflictingAppointments.length > 0) {
          let processedCount = 0;
          for (const app of conflictingAppointments) {
            const newStatus = app.status === 'confirmed' ? 'cancelled' : 'rejected';
            const { error: updateError } = await supabase.from('appointments').update({
              status: newStatus,
              admin_notes: 'Day has been blocked by the SRO',
              updated_at: new Date().toISOString()
            }).eq('id', app.id);

            if (!updateError) {
              processedCount++;

              // Send Email Notification
              const studentEmail = app.account?.email;
              if (studentEmail) {
                try {
                  const emailSubject = `Appointment ${newStatus === 'cancelled' ? 'Cancelled' : 'Rejected'} - SRO Admin`;
                  const emailMessage = `
                            <p>Dear ${app.account?.account_name || 'Student'},</p>
                            <p>Your appointment scheduled for <strong>${format(new Date(app.appointment_date), 'MMMM d, yyyy')}</strong> at <strong>${app.time_slot}</strong> has been <strong>${newStatus}</strong>.</p>
                            <p><strong>Reason:</strong> Day has been blocked by the SRO.</p>
                            <p>We apologize for the inconvenience. Please log in to the portal to book a new appointment.</p>
                            <br/>
                            <p>Best regards,<br/>SRO Admin</p>
                        `;

                  await authFetch(`${API_BASE_URL}/api/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      to: studentEmail,
                      subject: emailSubject,
                      html: emailMessage
                    }),
                  });
                } catch (emailErr) {
                  console.error("Failed to send auto-cancellation email:", emailErr);
                  // Don't throw, just log so loop continues
                }
              }
            }
          }
          if (processedCount > 0) {
            toast.success(`Automatically cancelled/rejected ${processedCount} appointment(s) due to blocking.`);
          }
        }
      }
      if (datesToRemove.length > 0) {
        await supabase.from('blocked_slots').delete().in('block_date', datesToRemove);
      }

      // 3. Sync Blocked Times
      const timesToAdd = blockedTimeSlots.filter(t => !initialBlockedTimeSlots.includes(t));
      const timesToRemove = initialBlockedTimeSlots.filter(t => !blockedTimeSlots.includes(t));

      if (timesToAdd.length > 0) {
        await supabase.from('blocked_slots').insert(timesToAdd.map(t => ({ block_time: convertToDBTime(t) })));
      }
      if (timesToRemove.length > 0) {
        await supabase.from('blocked_slots').delete().in('block_time', timesToRemove.map(t => convertToDBTime(t)));
      }

      // Update initial state for next save
      setInitialBlockedDates(blockedDates);
      setInitialBlockedTimeSlots(blockedTimeSlots);
      setInitialStartTime(startTime);
      setInitialEndTime(endTime);
      setInitialInterval(interval);

      toast.success("Settings saved successfully!");
      loadAppointments(interval);

    } catch (error) {
      console.error("Save failed", error);
      toast.error("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // --- Unsaved Changes Handlers ---

  const getUnsavedChanges = () => {
    const changes = [];

    // Check Settings
    if (startTime !== initialStartTime) changes.push(`Start Time changed to ${startTime}`);
    if (endTime !== initialEndTime) changes.push(`End Time changed to ${endTime}`);
    if (interval !== initialInterval) changes.push(`Interval changed to ${interval} mins`);

    // Check Blocked Dates
    const datesAdded = blockedDates.filter(d => !initialBlockedDates.includes(d)).length;
    const datesRemoved = initialBlockedDates.filter(d => !blockedDates.includes(d)).length;
    if (datesAdded > 0) changes.push(`${datesAdded} Blocked Date(s) Added`);
    if (datesRemoved > 0) changes.push(`${datesRemoved} Blocked Date(s) Removed`);

    // Check Blocked Times
    const timesAdded = blockedTimeSlots.filter(t => !initialBlockedTimeSlots.includes(t)).length;
    const timesRemoved = initialBlockedTimeSlots.filter(t => !blockedTimeSlots.includes(t)).length;
    if (timesAdded > 0) changes.push(`${timesAdded} Blocked Time(s) Added`);
    if (timesRemoved > 0) changes.push(`${timesRemoved} Blocked Time(s) Removed`);

    return changes;
  };

  const handleTabChange = (newValue) => {
    if (activeTab === 'settings' && newValue !== 'settings') {
      const changes = getUnsavedChanges();
      if (changes.length > 0) {
        setPendingTab(newValue);
        setShowUnsavedDialog(true);
        return;
      }
    }
    setActiveTab(newValue);
  };

  const confirmTabChange = () => {
    setActiveTab(pendingTab);
    setShowUnsavedDialog(false);
  };

  // Warn on browser unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const changes = getUnsavedChanges();
      if (changes.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  // --- Handlers (Appointments) ---

  const processAppointmentAction = async (appointmentId, action, type) => {
    setIsProcessing(true);
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('requested_date, requested_time_slot')
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      const updateData = {
        status: action === 'approve' ? (type === 'reschedule' ? 'scheduled' : 'cancelled') : 'scheduled',
      };

      if (type === 'reschedule') {
        if (action === 'approve') {
          updateData.appointment_date = appointment.requested_date;
          updateData.appointment_time = appointment.requested_time_slot;
        }
        updateData.requested_date = null;
        updateData.requested_time_slot = null;
        updateData.reschedule_reason = null;
        updateData.reschedule_requested = false;
      } else {
        updateData.cancellation_requested = false;
      }

      const { error } = await supabase.from('appointments').update(updateData).eq('id', appointmentId);
      if (error) throw error;

      toast.success(action === 'approve' ? 'Request approved' : 'Request rejected');
      loadAppointments(interval);
      setShowConfirmDialog(false);
    } catch {
      toast.error("Process failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const processAppointmentResponse = async (appointmentId, action) => {
    setIsProcessing(true);
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select(`*, account:account(account_name, email)`).eq('id', appointmentId).single();
      if (fetchError) throw fetchError;

      const { error } = await supabase.from('appointments').update({
        status: action === 'confirm' ? 'confirmed' : (action === 'cancel' ? 'cancelled' : 'rejected'),
        admin_notes: adminComment,
        updated_at: new Date()
      }).eq('id', appointmentId);

      if (error) throw error;

      // Basic Email Sending - Preserving existing patterns
      const emailSubject = action === 'confirm' ? 'Appointment Confirmed' : (action === 'cancel' ? 'Appointment Cancelled' : 'Appointment Rejected');

      try {
        await authFetch(`${API_BASE_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: appointment.account.email,
            subject: `${emailSubject} - ${appointment.reason}`,
            text: `Your appointment status has been updated to ${action}.`,
            html: `<p>Your appointment status has been updated to <strong>${action}</strong>.</p>`
          })
        });
      } catch (e) { console.error("Email failed", e); }

      toast.success(`Appointment ${action}ed`);
      loadAppointments(interval);
      setShowConfirmDialog(false);
      setShowRejectDialog(false);
      setAdminComment("");
    } catch {
      toast.error("Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Calendar Helpers ---
  const getEventColor = (category, event) => {
    const status = event.status;
    if (status === 'confirmed') return 'bg-sro-secondary text-white';
    if (status === 'scheduled') return 'bg-gray-100 text-gray-700 border border-gray-300';
    if (status === 'reschedule-pending') return 'bg-amber-100 text-amber-700 border border-amber-300';
    if (status === 'rejected') return 'bg-red-100 text-sro-primary border border-sro-primary';
    return 'bg-blue-100 text-blue-700';
  };

  const handleCalendarDateSelect = (dateOrEvent) => {
    const date = dateOrEvent instanceof Date ? dateOrEvent : (dateOrEvent.date ? new Date(dateOrEvent.date) : null);
    if (date) {
      if (selectedDateFilter && isSameDay(date, selectedDateFilter)) {
        setSelectedDateFilter(null);
      } else {
        setSelectedDateFilter(date);
      }
    }
  };

  const calendarEvents = useMemo(() => {
    return appointments.filter(app => {
      if (app.status === 'confirmed') return true;
      if (showRequests) return ['scheduled', 'reschedule-pending'].includes(app.status);
      return false;
    });
  }, [appointments, showRequests]);

  const filteredCalendarList = useMemo(() => {
    if (!selectedDateFilter) return [];
    return calendarEvents.filter(event => isSameDay(new Date(event.appointment_date), selectedDateFilter));
  }, [calendarEvents, selectedDateFilter]);

  // --- FULL Columns Definition (Restored) ---
  const columns = [
    {
      key: 'created_at',
      header: 'Submission Date',
      sortable: true,
      width: 'w-32',
      render: (row) => (
        <div className="text-xs text-gray-500">
          {new Date(row.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      )
    },
    {
      key: 'student',
      header: 'Student Details',
      sortable: true,
      accessor: (row) => row.formattedName,
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-sm">{row.formattedName}</span>
          <span className="text-xs text-gray-500">{row.email}</span>
          <span className="text-xs text-gray-400">{row.contact_number}</span>
        </div>
      )
    },
    {
      key: 'reason',
      header: 'Type',
      sortable: true,
      filterable: true,
      filterLabel: "Types",
      filterOptions: ['Consultation', 'Document', 'Inquiry', 'Other'],
      filterAccessor: (row) => {
        const map = { 'consultation': 'Consultation', 'document': 'Document', 'inquiry': 'Inquiry', 'other': 'Other' };
        return map[row.reason] || row.reason;
      },
      render: (row) => {
        const map = { 'consultation': 'Consultation', 'document': 'Document', 'inquiry': 'Inquiry', 'other': 'Other' };
        const label = map[row.reason] || row.reason;
        return (
          <div className="flex flex-col items-start">
            <span className="font-medium text-sm">{label}</span>
            {row.specified_reason && row.specified_reason !== label && (
              <span className="text-xs text-gray-500 truncate max-w-[120px]" title={row.specified_reason}>
                {row.specified_reason}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'meeting_mode',
      header: 'Mode',
      sortable: true,
      filterable: true,
      filterLabel: "Modes",
      filterOptions: ['Face-to-face', 'Online'],
      filterAccessor: (row) => row.meeting_mode === 'face-to-face' ? 'Face-to-face' : 'Online',
      render: (row) => (
        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium border w-24 ${row.meeting_mode === 'face-to-face'
          ? 'bg-red-50 text-sro-primary border-sro-primary/20'
          : 'bg-green-50 text-sro-secondary border-sro-secondary/20'
          }`}>
          {row.meeting_mode === 'face-to-face' ? 'Face-to-face' : 'Online'}
        </span>
      )
    },
    {
      key: 'appointment_date',
      header: 'Schedule',
      sortable: true,
      accessor: (row) => new Date(row.appointment_date + 'T' + row.appointment_time),
      render: (row) => (
        <div className="flex flex-col items-center">
          <span className="font-medium">
            {new Date(row.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-xs text-gray-500 font-mono bg-gray-50 px-1 rounded">
            {row.timeRange}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      isStatus: true,
      width: 'w-32',
      filterable: true,
      filterOptions: ['Scheduled', 'Confirmed', 'Rejected', 'For Reschedule'],
      filterAccessor: (row) => {
        const map = {
          'scheduled': 'Scheduled',
          'confirmed': 'Confirmed',
          'rejected': 'Rejected',
          'reschedule-pending': 'For Reschedule'
        };
        return map[row.status] || row.status.charAt(0).toUpperCase() + row.status.slice(1);
      }
    }
  ];

  const datesWithAppointments = useMemo(() => {
    return appointments
      .filter(a => ['scheduled', 'confirmed', 'reschedule-pending'].includes(a.status))
      .map(a => new Date(a.appointment_date));
  }, [appointments]);

  if (loading) return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
      <TableSkeleton />
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <Toaster expand={true} theme="light" toastOptions={{ style: { zIndex: 10000 } }} />
      <h1 className="page-header text-sro-primary">Appointments</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Appointment Requests</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <DataTable
            columns={columns}
            data={appointments}
            onRowClick={(row) => { setSelectedAppointment(row); setShowConfirmDialog(true); }}
            emptyMessage="No appointments found."
            defaultPageSize={10}
            defaultSort={{ key: 'created_at', direction: 'desc' }}
            viewMode="table"
            hideViewToggle={true}
          />
        </TabsContent>

        <TabsContent value="calendar">
          {/* Calendar Tab Content */}
          <CalendarWithSidePanel
            currentDate={currentDate}
            onMonthChange={setCurrentDate}
            selectedDate={selectedDateFilter}
            onDateSelect={(date) => {
              if (selectedDateFilter && isSameDay(date, selectedDateFilter)) {
                setSelectedDateFilter(null);
              } else {
                setSelectedDateFilter(date);
              }
            }}
            events={calendarEvents}
            getEventColor={getEventColor}
            sidePanelTitle={selectedDateFilter ? `Appointments on ${format(selectedDateFilter, 'MMM d, yyyy')}` : 'Select a date'}
            legendItems={[
              { label: "Confirmed", colorClass: "text-sro-secondary", indicatorClass: "bg-sro-secondary" },
              { label: "Scheduled", colorClass: "text-gray-700", indicatorClass: "bg-gray-300" },
              { label: "For Reschedule", colorClass: "text-amber-700", indicatorClass: "bg-amber-300" },
            ]}
            filters={[
              { label: "Requests", checked: showRequests, onChange: setShowRequests }
            ]}
            renderSidePanel={(date) => (
              <div className="space-y-3">
                {filteredCalendarList.length > 0 ? filteredCalendarList.map(app => (
                  <div key={app.id} onClick={() => { setSelectedAppointment(app); setShowConfirmDialog(true); }} className="p-3 bg-white border rounded-lg cursor-pointer hover:border-sro-primary/50 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sro-primary text-sm line-clamp-2">{app.formattedName || app.title}</span>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getEventColor(null, app).split(' ')[0].replace('bg-', 'border-').replace('text-', 'text-')} bg-white`}>
                        {app.status === 'reschedule-pending' ? 'For Reschedule' : app.status}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Type:</span> <span className="truncate">{app.reason}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Mode:</span> <span className="truncate">{app.meeting_mode === 'face-to-face' ? 'Face-to-face' : 'Online'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{app.timeRange}</span>
                      </div>
                      {/* Show description if available */}
                      <div className="truncate text-gray-400 italic" title={app.specified_reason}>{app.specified_reason || app.reason}</div>
                    </div>
                  </div>
                )) : <div className="text-center py-8 text-gray-400 text-sm">No appointments for this date.</div>}
              </div>
            )}

          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ConsultationHoursSettings
            startTime={startTime} setStartTime={setStartTime}
            endTime={endTime} setEndTime={setEndTime}
            interval={interval} setInterval={setInterval}
          />

          <div className="grid grid-cols-1 gap-6">
            <BlockedDatesSettings
              blockedDates={blockedDates}
              onToggleDate={handleToggleDate}
              onAddBlockedDates={handleAddBlockedDates}
              datesWithAppointments={datesWithAppointments}
            />

            <TimeSlotsSettings
              timeSlots={timeSlots}
              blockedTimeSlots={blockedTimeSlots}
              onToggleSlot={handleToggleTimeSlot}
              onBlockAll={handleBlockAllSlots}
              onUnblockAll={handleUnblockAllSlots}
              onBlockLunch={handleBlockLunch}
            />
          </div>

          <div className="flex justify-end pt-4 pb-12">
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-sro-primary hover:bg-sro-primary/90 text-white min-w-[150px]"
            >
              {savingSettings ? <LoadingSpinner variant="inline" text="" /> : <Save className="w-4 h-4 mr-2" />}
              {savingSettings ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Appointment Details Dialog - Restored Full Detail */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Appointment Details</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Student Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Student Information</h3>
                  <div className="mt-1">
                    <p className="text-sm">{selectedAppointment.formattedName}</p>
                    <p className="text-sm text-gray-500">{selectedAppointment.email}</p>
                    <p className="text-sm text-gray-500">{selectedAppointment.contact_number}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Appointment Status</h3>
                  <div className="mt-1">
                    <StatusPill status={selectedAppointment.status} />
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Meeting Details</h3>
                <div className="mt-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> {(() => {
                        switch (selectedAppointment.reason) {
                          case 'consultation': return 'General Consultation';
                          case 'document': return 'Document Processing';
                          case 'inquiry': return 'General Inquiry';
                          case 'other': return 'Other';
                          default: return selectedAppointment.reason;
                        }
                      })()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {selectedAppointment.specified_reason}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Mode:</span> {selectedAppointment.meeting_mode === 'face-to-face' ? 'Face-to-face' : 'Online'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Date:</span> {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Time:</span> {selectedAppointment.timeRange}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Requested:</span> {new Date(selectedAppointment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Additional Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-100">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}
                {selectedAppointment.admin_notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Admin Notes (SRO Response)</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-red-50 p-3 rounded-md border border-red-100">
                      {selectedAppointment.admin_notes}
                    </p>
                  </div>
                )}
              </div>

              {selectedAppointment.status === 'reschedule-pending' && (
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">Reschedule Request Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Original Schedule</span>
                      <p className="text-sm font-medium">
                        {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">{selectedAppointment.timeRange}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Proposed Schedule</span>
                      <p className="text-sm font-medium text-amber-900">
                        {selectedAppointment.requestedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-amber-800">
                        {selectedAppointment.requestedTime}
                      </p>
                    </div>
                  </div>
                  {selectedAppointment.reschedule_reason && (
                    <div className="mt-2 text-sm text-amber-900">
                      <span className="font-medium">Reason:</span> {selectedAppointment.reschedule_reason}
                    </div>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              {selectedAppointment.status === 'scheduled' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Admin Notes</h3>
                  <Textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Add any comments or instructions for the student..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isProcessing}>Close</Button>
                {selectedAppointment.status === 'scheduled' && (
                  <ActionButtons
                    confirmLabel="Confirm"
                    rejectLabel="Reject"
                    confirmVariant="secondary"
                    rejectVariant="primary"
                    onConfirm={() => processAppointmentResponse(selectedAppointment.id, 'confirm')}
                    onReject={() => {
                      setShowConfirmDialog(false);
                      setActionType('reject');
                      setShowRejectDialog(true);
                      return Promise.resolve();
                    }}
                    rejectSuccessMessage={null}
                    disabled={isProcessing}
                  />
                )}
                {selectedAppointment.status === 'reschedule-pending' && (
                  <ActionButtons
                    confirmLabel="Approve Reschedule"
                    rejectLabel="Reject Reschedule"
                    confirmVariant="secondary"
                    rejectVariant="primary"
                    onConfirm={() => processAppointmentAction(selectedAppointment.id, 'approve', 'reschedule')}
                    onReject={() => processAppointmentAction(selectedAppointment.id, 'reject', 'reschedule')}
                    confirmSuccessMessage={null}
                    rejectSuccessMessage={null}
                    disabled={isProcessing}
                  />
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <Button
                    variant="destructive"
                    className="bg-sro-primary text-white hover:bg-sro-primary/90"
                    onClick={() => {
                      setShowConfirmDialog(false);
                      setActionType('cancel');
                      setShowRejectDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel Appointment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>{actionType === 'cancel' ? 'Cancel Appointment' : 'Reject Appointment'}</DialogTitle>
            <DialogDescription>
              Please provide a reason for {actionType === 'cancel' ? 'cancelling' : 'rejecting'} this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder={`Reason for ${actionType === 'cancel' ? 'cancellation' : 'rejection'}...`}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <ActionButtons
              confirmLabel={actionType === 'cancel' ? 'Cancel Appointment' : 'Reject Appointment'}
              confirmVariant="primary"
              onConfirm={() => processAppointmentResponse(selectedAppointment?.id, actionType === 'cancel' ? 'cancel' : 'reject')}
              confirmSuccessMessage={null}
              onSuccess={() => {
                setShowRejectDialog(false);
                setAdminComment("");
                setSelectedAppointment(null);
              }}
              rejectLabel="Close"
              rejectVariant="outline"
              onReject={() => Promise.resolve(setShowRejectDialog(false))}
              rejectSuccessMessage={null}
              disabled={isProcessing}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-sro-primary">
              <AlertTriangle className="h-5 w-5" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You have unsaved changes in the Settings tab. Leaving without saving will discard these changes.</p>

              <div className="bg-red-50 border border-red-100 rounded-md p-3 text-sm">
                <p className="font-semibold text-red-800 mb-1">Pending Changes:</p>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {getUnsavedChanges().map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </div>

              <p>Are you sure you want to discard changes and leave?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>Stay & Save</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTabChange} className="bg-sro-primary hover:bg-sro-primary/90 text-white">
              Discard & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div >
  );
};

export default AdminAppointmentSettings;