import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import supabase from "../../lib/supabase";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import DataTable from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import CustomCalendar from "@/components/ui/custom-calendar"; // Import CustomCalendar
import { isSameDay, format } from "date-fns"; // Import date utilities

const AdminAppointmentSettings = () => {
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [interval, setInterval] = useState(30);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addingDate, setAddingDate] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [adminComment, setAdminComment] = useState("");

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [showRequests, setShowRequests] = useState(false);


  // Load settings and blocking slots
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get appointment settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('appointment_settings')
          .select('*')
          .order('id', { ascending: false })
          .limit(1)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        if (settingsData) {
          setStartTime(settingsData.start_time.substring(0, 5));
          setEndTime(settingsData.end_time.substring(0, 5));
          setInterval(settingsData.interval_minutes);
        }

        // Get blocked dates and times
        const { data: blockedSlotsData, error: blockedSlotsError } = await supabase
          .from('blocked_slots')
          .select('*');

        if (blockedSlotsError) throw blockedSlotsError;

        const dates = blockedSlotsData
          .filter(slot => slot.block_date)
          .map(slot => slot.block_date);

        const times = blockedSlotsData
          .filter(slot => slot.block_time)
          .map(slot => {
            const time = new Date(`2000-01-01T${slot.block_time}`);
            return time.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          });

        setBlockedDates(dates);
        setBlockedTimeSlots(times);
        setLoading(false);
      } catch (error) {
        console.error("Error loading settings:", error);
        setMessage({
          text: "Failed to load settings. Please refresh the page.",
          type: "error"
        });
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load Appointments
  const loadAppointments = async () => {
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (settingsError) throw settingsError; // Get upcoming appointments
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          created_at,
          reason,
          specified_reason,
          appointment_date,
          appointment_time,
          contact_number,
          email,
          meeting_mode,
          requested_date,
          requested_time_slot,
          reschedule_reason,
          account:account(account_name, email),
          status
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAppointments = data.map(appointment => {
        const startTime = new Date(`2000-01-01T${appointment.appointment_time}`);
        const endTime = new Date(startTime.getTime() + (settings?.interval_minutes || 30) * 60000);

        const timeRange = `${startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })} - ${endTime.toLocaleTimeString('en-US', {
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
          // Calendar Event props
          date: new Date(appointment.appointment_date),
          title: formattedName || 'Appointment',
          // Reschedule details
          requestedDate: appointment.requested_date ? new Date(appointment.requested_date) : null,
          requestedTime: appointment.requested_time_slot ? new Date(`2000-01-01T${appointment.requested_time_slot}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : null,
        };
      });

      setAppointments(formattedAppointments);
      setLoadingAppointments(false);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setMessage({
        text: "Failed to load appointments",
        type: "error"
      });
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // ... (Keep existing handlers: handleSaveSettings, handleAddBlockedDate, etc.)
  // Handle saving consultation time settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const { error } = await supabase
        .from('appointment_settings')
        .upsert({
          id: 1,
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          interval_minutes: interval
        });
      if (error) throw error;
      setMessage({ text: "Settings saved successfully!", type: "success" });
      setTimeout(() => { setMessage({ text: "", type: "" }); }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ text: "Failed to save settings. Please try again.", type: "error" });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return;
    try {
      setAddingDate(true);
      const { error } = await supabase.from('blocked_slots').insert({ block_date: newBlockedDate });
      if (error) throw error;
      setBlockedDates([...blockedDates, newBlockedDate]);
      setNewBlockedDate("");
      setMessage({ text: "Date blocked successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error adding blocked date:", error);
      setMessage({ text: "Failed to block date.", type: "error" });
    } finally {
      setAddingDate(false);
    }
  };

  const handleRemoveBlockedDate = async (date) => {
    try {
      const { error } = await supabase.from('blocked_slots').delete().eq('block_date', date);
      if (error) throw error;
      setBlockedDates(blockedDates.filter(d => d !== date));
      setMessage({ text: "Date unblocked successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error removing blocked date:", error);
      setMessage({ text: "Failed to unblock date.", type: "error" });
    }
  };

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

  const toggleTimeSlot = async (slot) => {
    try {
      const timeStr = slot;
      let hours = parseInt(timeStr.match(/^(\d+)/)[1]);
      const minutes = parseInt(timeStr.match(/:(\d+)/)[1]);
      const period = timeStr.match(/([AP]M)$/)[1];
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      if (blockedTimeSlots.includes(slot)) {
        const { error } = await supabase.from('blocked_slots').delete().eq('block_time', formattedTime);
        if (error) throw error;
        setBlockedTimeSlots(blockedTimeSlots.filter(s => s !== slot));
      } else {
        const { error } = await supabase.from('blocked_slots').insert({ block_time: formattedTime });
        if (error) throw error;
        setBlockedTimeSlots([...blockedTimeSlots, slot]);
      }
    } catch (error) {
      console.error("Error toggling time slot:", error);
      setMessage({ text: "Failed to update time slot.", type: "error" });
    }
  };

  const handleAppointmentAction = async (appointmentId, action, type) => {
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      if (fetchError) throw fetchError;
      const { error } = await supabase.from('appointments').update({
        status: action === 'approve' ? (type === 'reschedule' ? 'scheduled' : 'cancelled') : 'scheduled',
        ...(type === 'reschedule' && action === 'approve' ? {
          appointment_date: appointment.requested_date,
          appointment_time: appointment.requested_time_slot,
          requested_date: null, requested_time_slot: null, reschedule_reason: null, reschedule_requested: false
        } : type === 'reschedule' ? {
          requested_date: null, requested_time_slot: null, reschedule_reason: null, reschedule_requested: false
        } : { cancellation_requested: false })
      }).eq('id', appointmentId);
      if (error) throw error;
      toast.success(`${type === 'reschedule' ? 'Reschedule' : 'Cancellation'} request ${action === 'approve' ? 'approved' : 'rejected'}`);
      loadAppointments();
    } catch (error) {
      console.error(`Error ${action}ing ${type} request:`, error);
      toast.error(`Failed to ${action} ${type} request`);
    }
  };

  const handleAppointmentResponse = async (appointmentId, action) => {
    if (!appointmentId) return;
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select(`*, account:account(account_name, email)`).eq('id', appointmentId).single();
      if (fetchError) throw fetchError;
      const { error } = await supabase.from('appointments').update({
        status: action === 'confirm' ? 'confirmed' : 'rejected',
        admin_notes: adminComment,
        updated_at: new Date()
      }).eq('id', appointmentId);
      if (error) throw error;
      // (Email sending code preserved but minimized for brevity in this tool call, assume standard fetch)
      const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const appointmentTime = new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
      });
      const response = await fetch(`${API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: appointment.account.email,
          subject: `Appointment ${action === 'confirm' ? 'Confirmed' : 'Rejected'} - ${appointment.reason}`,
          text: `Your appointment has been ${action === 'confirm' ? 'confirmed' : 'rejected'}.`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 className={action === 'confirm' ? 'text-sro-secondary' : 'text-sro-primary'}>Appointment ${action === 'confirm' ? 'Confirmed' : 'Rejected'}</h2>
  
  <p>Your appointment has been <strong>${action === 'confirm' ? 'confirmed' : 'rejected'}</strong>.</p>
  
  <div className="bg-sro-bg-off-white p-4 rounded-md my-4">
    <p><strong>Date:</strong> ${appointmentDate}</p>
    <p><strong>Time:</strong> ${appointmentTime}</p>
    <p><strong>Purpose:</strong> ${appointment.reason}${appointment.specified_reason ? ' - ' + appointment.specified_reason : ''}</p>
    <p><strong>Mode:</strong> ${appointment.meeting_mode || 'Face-to-face'}</p>
  </div>
  
  ${adminComment ? `<p><strong>SRO Notes:</strong> ${adminComment}</p>` : ''}
  
  <p>${action === 'confirm'
              ? 'Please be on time for your appointment. If you need to reschedule or cancel, please do so at least 24 hours in advance.'
              : 'If you would like to schedule another appointment, please visit our website.'}</p>
  
  <p>Thank you,<br>Student Relations Office</p>
</div>`
        })
      });
      if (!response.ok) throw new Error('Failed to send confirmation email');

      toast.success(`Appointment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`);
      setShowConfirmDialog(false);
      setShowRejectDialog(false);
      setAdminComment("");
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      toast.error(`Failed to ${action} appointment`);
    }
  };
  // ... End existing handlers

  const timeSlots = generateTimeSlots();

  // Calendar Helper Functions
  const getEventColor = (category, event) => {
    // Map Appointment Status to Colors for Calendar
    const status = event.status;
    if (status === 'confirmed') return 'bg-sro-secondary text-white';
    if (status === 'scheduled') return 'bg-gray-100 text-gray-700 border border-gray-300';
    if (status === 'reschedule-pending') return 'bg-amber-100 text-amber-700 border border-amber-300';
    if (status === 'rejected') return 'bg-red-100 text-sro-primary border border-sro-primary';
    return 'bg-blue-100 text-blue-700';
  };

  const handleDateSelect = (dateOrEvent) => {
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
      // Logic:
      // Show Requests OFF: Show ONLY 'confirmed'
      // Show Requests ON: Show 'confirmed', 'scheduled', 'reschedule-pending'

      if (app.status === 'confirmed') return true;

      if (showRequests) {
        return ['scheduled', 'reschedule-pending'].includes(app.status);
      }

      return false;
    });
  }, [appointments, showRequests]);

  const filteredCalendarList = useMemo(() => {
    if (!selectedDateFilter) return [];
    return calendarEvents.filter(event => isSameDay(new Date(event.appointment_date), selectedDateFilter));
  }, [calendarEvents, selectedDateFilter]);


  // Define table columns
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

  if (loading) {
    return <LoadingSpinner text="Loading appointment settings..." variant="section" />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <Toaster toastOptions={{ style: { zIndex: 10000 } }} />
      <h1 className="page-header text-sro-primary">Appointment Management</h1>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="flex flex-col h-auto w-full md:inline-flex md:w-auto md:h-10 md:flex-row">
          <TabsTrigger value="requests" className="w-full md:w-auto">Appointment Requests</TabsTrigger>
          <TabsTrigger value="calendar" className="w-full md:w-auto">Appointments</TabsTrigger>
          <TabsTrigger value="settings" className="w-full md:w-auto">Settings</TabsTrigger>
        </TabsList>

        {/* Requests / Booking Tab */}
        <TabsContent value="requests">
          <DataTable
            columns={columns}
            data={appointments}
            defaultPageSize={10}
            defaultSort={{ key: 'created_at', direction: 'desc' }}
            emptyMessage="No appointments found."
            onRowClick={(row) => {
              setSelectedAppointment(row);
              setShowConfirmDialog(true);
            }}
            viewMode="table"
            hideViewToggle={true}
          />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <div className="flex justify-between items-center mb-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sro-secondary"></span>
                <span className="text-xs text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></span>
                <span className="text-xs text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-200 border border-amber-500"></span>
                <span className="text-xs text-gray-600">For Reschedule</span>
              </div>
            </div>

            {/* Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-md shadow-sm border">
              <input
                type="checkbox"
                checked={showRequests}
                onChange={(e) => setShowRequests(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-sro-primary focus:ring-sro-primary"
              />
              <span className="text-sm font-medium text-gray-700">Show Requests</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md border p-4">
                <CustomCalendar
                  mode="activities"
                  currentMonth={currentDate}
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDateFilter}
                  onMonthChange={setCurrentDate}
                  events={calendarEvents}
                  getEventColor={getEventColor}
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDateFilter ? `Appointments on ${format(selectedDateFilter, 'MMM d, yyyy')}` : 'Select a date'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateFilter ? (
                    <div className="space-y-3">
                      {filteredCalendarList.length > 0 ? (
                        filteredCalendarList.map(app => (
                          <div
                            key={app.id}
                            className="p-3 bg-gray-50 hover:bg-white hover:shadow-sm border rounded-md cursor-pointer transition-all"
                            onClick={() => {
                              setSelectedAppointment(app);
                              setShowConfirmDialog(true);
                            }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-sro-primary text-sm">{app.formattedName}</span>
                              <StatusPill status={app.status} compact />
                            </div>
                            <div className="text-xs text-gray-600 flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Time:</span> {app.timeRange}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Mode:</span> {app.meeting_mode === 'face-to-face' ? 'Face-to-face' : 'Online'}
                              </div>
                              <div className="truncate text-gray-500 italic" title={app.specified_reason}>
                                {app.specified_reason || app.reason}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No appointments scheduled for this date.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      Click on a date in the calendar to view scheduled appointments.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Consultation Hours Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Consultation Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <input
                      type="time"
                      className="w-full p-2 border rounded-md"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <input
                      type="time"
                      className="w-full p-2 border rounded-md"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Interval (minutes)</label>
                    <UnifiedDropdown
                      options={[
                        { value: "15", label: "15 minutes" },
                        { value: "30", label: "30 minutes" },
                        { value: "45", label: "45 minutes" },
                        { value: "60", label: "1 hour" }
                      ]}
                      value={String(interval)}
                      onChange={(val) => setInterval(Number(val))}
                      placeholder="Select interval"
                    />
                  </div>
                </div>
              </div>

              {/* Blocked Dates Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Blocked Dates</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="flex-1 p-2 border rounded-md"
                      value={newBlockedDate}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                    />
                    <button
                      className="px-4 py-2 bg-sro-primary hover:bg-sro-primary/90 text-white rounded-md whitespace-nowrap"
                      onClick={handleAddBlockedDate}
                      disabled={addingDate || !newBlockedDate}
                    >
                      {addingDate ? (
                        <div className="flex items-center">
                          <LoadingSpinner className="h-4 w-4 mr-2" variant="inline" text="" />
                          <span>Adding...</span>
                        </div>
                      ) : (
                        "Block Date"
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {blockedDates.map((date) => (
                      <div key={date} className="flex items-center justify-between p-2 bg-sro-primary rounded-md">
                        <span className="text-white">{new Date(date).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleRemoveBlockedDate(date)}
                          className="text-white hover:text-gray-500 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Slots Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Time Slots</h3>
                <p className="text-gray-600 text-sm mb-4">Click on time slots to block/unblock them globally</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      className={`p-2 border rounded-md text-sm ${blockedTimeSlots.includes(slot)
                        ? "bg-sro-primary text-white hover:bg-sro-primary/90 transition-colors"
                        : "bg-sro-secondary text-white hover:bg-sro-secondary/90 transition-colors"
                        }`}
                      onClick={() => toggleTimeSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="pt-4 border-t">
                <button
                  className="px-4 py-2 bg-sro-primary text-white rounded-md hover:bg-sro-primary/90 transition-colors"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <div className="flex items-center">
                      <LoadingSpinner className="h-4 w-4 mr-2" variant="inline" text="" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save All Settings"
                  )}
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Appointment Details Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        {/* ... (Kept existing dialog content) */}
        <DialogContent className="max-w-2xl">
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
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Time:</span> {selectedAppointment.timeRange}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Requested:</span> {new Date(selectedAppointment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
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
                        {/* Calculate end time for proposed just for display if needed, but requestedTime is just start or range? Assuming start based on DB schema */}
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
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Close
                </Button>
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <Button
                      onClick={() => handleAppointmentResponse(selectedAppointment.id, 'confirm')}
                      className="bg-sro-secondary text-white hover:bg-sro-secondary/90"
                    >
                      Confirm
                    </Button>
                    <Button
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setShowRejectDialog(true);
                      }}
                      className="bg-sro-primary text-white hover:bg-sro-primary/90"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'reschedule-pending' && (
                  <>
                    <Button
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'approve', 'reschedule')}
                      className="bg-sro-secondary text-white hover:bg-sro-secondary/90"
                    >
                      Approve Reschedule
                    </Button>
                    <Button
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'reject', 'reschedule')}
                      className="bg-sro-primary text-white hover:bg-sro-primary/90"
                    >
                      Reject Reschedule
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Reason for rejection..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAppointmentResponse(selectedAppointment?.id, 'reject')}
              variant="destructive"
            >
              Reject Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message display */}
      {
        message.text && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
            {message.text}
          </div>
        )
      }
    </div >
  );
};

export default AdminAppointmentSettings;