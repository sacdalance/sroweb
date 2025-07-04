import { useState, useEffect } from "react";
import supabase from "../../lib/supabase";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";
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

  // Load settings and blocked slots from the database
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
          // PGRST116 means no rows returned
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
        
        // Separate dates and times
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

  // Update the appointments query to include all needed fields
  const loadAppointments = async () => {
    try {
      // Get current date
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
        // Get appointment settings for interval
      const { data: settings, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (settingsError) throw settingsError;
      
      // Get upcoming appointments
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
          account:account(account_name, email),
          status
        `)
        .gte('appointment_date', formattedDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      
      // Format the appointments with end time based on interval
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

        // Split name into last name and first name
        const fullName = appointment.account?.account_name || '';
        const [lastName, ...firstNames] = fullName.split(',').map(part => part.trim());
        const formattedName = lastName && firstNames.length 
          ? `${lastName.toUpperCase()}, ${firstNames.join(' ')}` 
          : fullName;
        
        return {
          ...appointment,
          timeRange,
          formattedName,
          fullDetails: `${appointment.reason}${appointment.notes ? ` - ${appointment.notes}` : ''}`
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
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ 
        text: "Failed to save settings. Please try again.", 
        type: "error" 
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Add a blocked date
  const handleAddBlockedDate = async () => {
    if (!newBlockedDate || blockedDates.includes(newBlockedDate)) {
      return;
    }
    
    try {
      setAddingDate(true);
      
      // Insert new blocked date into the database
      const { error } = await supabase
        .from('blocked_slots')
        .insert({ block_date: newBlockedDate });
      
      if (error) throw error;
      
      setBlockedDates([...blockedDates, newBlockedDate]);
      setNewBlockedDate("");
      setMessage({ text: "Date blocked successfully!", type: "success" });
      
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error adding blocked date:", error);
      setMessage({ 
        text: "Failed to block date. Please try again.", 
        type: "error" 
      });
    } finally {
      setAddingDate(false);
    }
  };

  // Remove a blocked date
  const handleRemoveBlockedDate = async (date) => {
    try {
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('block_date', date);
      
      if (error) throw error;
      
      setBlockedDates(blockedDates.filter(d => d !== date));
      setMessage({ text: "Date unblocked successfully!", type: "success" });
      
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error removing blocked date:", error);
      setMessage({ 
        text: "Failed to unblock date. Please try again.", 
        type: "error" 
      });
    }
  };

  // Generate time slots based on start time, end time and interval
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

  // Toggle a time slot as blocked/unblocked
  const toggleTimeSlot = async (slot) => {
    try {
      // Format time for database
      const timeStr = slot;
      let hours = parseInt(timeStr.match(/^(\d+)/)[1]);
      const minutes = parseInt(timeStr.match(/:(\d+)/)[1]);
      const period = timeStr.match(/([AP]M)$/)[1];
      
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      if (blockedTimeSlots.includes(slot)) {
        // Unblock the time slot
        const { error } = await supabase
          .from('blocked_slots')
          .delete()
          .eq('block_time', formattedTime);
        
        if (error) throw error;
        
        setBlockedTimeSlots(blockedTimeSlots.filter(s => s !== slot));
      } else {
        // Block the time slot
        const { error } = await supabase
          .from('blocked_slots')
          .insert({ block_time: formattedTime });
        
        if (error) throw error;
        
        setBlockedTimeSlots([...blockedTimeSlots, slot]);
      }
    } catch (error) {
      console.error("Error toggling time slot:", error);
      setMessage({ 
        text: "Failed to update time slot. Please try again.", 
        type: "error" 
      });
    }
  };

  // Add functions to handle reschedule and cancellation requests
  const handleAppointmentAction = async (appointmentId, action, type) => {
    try {
      // Get the current appointment data
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
        
      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('appointments')
        .update({
          status: action === 'approve' ? 
            (type === 'reschedule' ? 'scheduled' : 'cancelled') : 
            'scheduled',
          ...(type === 'reschedule' && action === 'approve' ? {
            appointment_date: appointment.requested_date,
            appointment_time: appointment.requested_time_slot,
            requested_date: null,
            requested_time_slot: null,
            reschedule_reason: null,
            reschedule_requested: false
          } : type === 'reschedule' ? {
            requested_date: null,
            requested_time_slot: null,
            reschedule_reason: null,
            reschedule_requested: false
          } : {
            cancellation_requested: false
          })
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success(`${type === 'reschedule' ? 'Reschedule' : 'Cancellation'} request ${action === 'approve' ? 'approved' : 'rejected'}`);
      loadAppointments();
    } catch (error) {
      console.error(`Error ${action}ing ${type} request:`, error);
      toast.error(`Failed to ${action} ${type} request`);
    }
  };

  // Add function to handle appointment confirmation/rejection
  const handleAppointmentResponse = async (appointmentId, action) => {
    if (!appointmentId) return;

    try {
      // Get the appointment details first for email notification
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          account:account(account_name, email)
        `)
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update appointment status
      const { error } = await supabase
        .from('appointments')
        .update({
          status: action === 'confirm' ? 'confirmed' : 'rejected',
          admin_notes: adminComment,
          updated_at: new Date()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Format appointment time for email
      const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const appointmentTime = new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Send email notification
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: appointment.account.email,
          subject: `Appointment ${action === 'confirm' ? 'Confirmed' : 'Rejected'} - ${appointment.reason}`,
          text: `Your appointment has been ${action === 'confirm' ? 'confirmed' : 'rejected'}.
          
Date: ${appointmentDate}
Time: ${appointmentTime}
Purpose: ${appointment.reason}${appointment.specified_reason ? ' - ' + appointment.specified_reason : ''}
Mode: ${appointment.meeting_mode || 'Face-to-face'}

${adminComment ? `Admin Notes: ${adminComment}` : ''}

${action === 'confirm' 
  ? 'Please be on time for your appointment. If you need to reschedule or cancel, please do so at least 24 hours in advance.'
  : 'If you would like to schedule another appointment, please visit our website.'}

Thank you,
Student Relations Office`,
          html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: ${action === 'confirm' ? '#014421' : '#7B1113'}">Appointment ${action === 'confirm' ? 'Confirmed' : 'Rejected'}</h2>
  
  <p>Your appointment has been <strong>${action === 'confirm' ? 'confirmed' : 'rejected'}</strong>.</p>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
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

      if (!response.ok) {
        throw new Error('Failed to send confirmation email');
      }

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

  const timeSlots = generateTimeSlots();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner className="h-8 w-8 text-[#7B1113]" />
        <span className="ml-2">Loading appointment settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto p-6">
      <Toaster />
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">Appointment Management</h1>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="h-6 w-6 text-[#7B1113]" />
                <span className="ml-2">Loading appointments...</span>
              </div>
            ) : appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center">Timestamp</th>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center">Student</th>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center">Type</th>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center">Mode</th>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center">Date</th>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center">Time</th>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center">Contact</th>
                      <th className="px-3 py-2 text-xs font-medium text-[#014421] text-center w-[100px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr 
                        key={appointment.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowConfirmDialog(true);
                        }}
                      >
                        <td className="px-3 py-2 text-xs text-gray-700 text-center whitespace-nowrap">
                          {new Date(appointment.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }).replace(/\//g, '/')}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 text-center whitespace-nowrap">{appointment.formattedName}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 text-center whitespace-nowrap">
                          {(() => {
                            switch(appointment.reason) {
                              case 'consultation': return 'Consultation';
                              case 'document': return 'Document';
                              case 'inquiry': return 'Inquiry';
                              case 'other': return 'Other';
                              default: return appointment.reason;
                            }
                          })()}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 text-center whitespace-nowrap">
                          {appointment.meeting_mode === 'face-to-face' ? 'F2F' : 'Online'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 text-center whitespace-nowrap">
                          {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 text-center whitespace-nowrap">{appointment.timeRange}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 text-center">
                          <div className="flex flex-col">
                            <div>{appointment.contact_number}</div>
                            <div className="text-xs text-gray-500">{appointment.email}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${                            appointment.status === "confirmed" ? "bg-[#014421]/20 text-[#014421]" :
                            appointment.status === "rejected" ? "bg-[#7B1113]/20 text-[#7B1113]" :
                            appointment.status === "reschedule-pending" ? "bg-amber-100 text-amber-700" :
                            appointment.status === "scheduled" ? "bg-gray-100 text-gray-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {appointment.status === "confirmed" ? "Confirmed" :
                             appointment.status === "rejected" ? "Rejected" :
                             appointment.status === "reschedule-pending" ? "Reschedule" :
                             appointment.status === "cancellation-pending" ? "Cancel Req." :
                             appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan="8" className="px-3 py-2 text-xs text-gray-500 text-center">
                        Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming appointments scheduled.
              </div>
            )}
          </Card>
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
                    <select
                      className="w-full p-2 border rounded-md"
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
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
                      className="px-4 py-2 bg-[#7B1113] hover:bg-[#5e0d0e] text-white rounded-md whitespace-nowrap"
                      onClick={handleAddBlockedDate}
                      disabled={addingDate || !newBlockedDate}
                    >
                      {addingDate ? (
                        <div className="flex items-center">
                          <Spinner className="h-4 w-4 mr-2" />
                          <span>Adding...</span>
                        </div>
                      ) : (
                        "Block Date"
                      )}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {blockedDates.map((date) => (
                      <div key={date} className="flex items-center justify-between p-2 bg-[#7b1113] rounded-md">
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
                      className={`p-2 border rounded-md text-sm ${
                        blockedTimeSlots.includes(slot) 
                          ? "bg-[#7B1113] text-white hover:bg-[#5e0d0e] transition-colors"
                          : "bg-[#014421] text-white hover:bg-[#014421]/90 transition-colors"
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
                  className="px-4 py-2 bg-[#7B1113] text-white rounded-md hover:bg-[#5e0d0e] transition-colors"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <div className="flex items-center">
                      <Spinner className="h-4 w-4 mr-2" />
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
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${                      selectedAppointment.status === "confirmed" ? "bg-[#014421]/20 text-[#014421]" :
                      selectedAppointment.status === "rejected" ? "bg-[#7B1113]/20 text-[#7B1113]" :
                      selectedAppointment.status === "reschedule-pending" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {selectedAppointment.status === "confirmed" ? "Confirmed" :
                       selectedAppointment.status === "rejected" ? "Rejected" :
                       selectedAppointment.status === "reschedule-pending" ? "Reschedule Requested" :
                       selectedAppointment.status === "cancellation-pending" ? "Cancellation Requested" :
                       selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                    </span>
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
                        switch(selectedAppointment.reason) {
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
                      className="bg-[#014421] text-white hover:bg-[#014421]/90"
                    >
                      Confirm
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setShowRejectDialog(true);
                      }}
                      className="bg-[#7B1113] text-white hover:bg-[#7B1113]/90"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'reschedule-pending' && (
                  <>
                    <Button 
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'approve', 'reschedule')}
                      className="bg-[#014421] text-white hover:bg-[#014421]/90"
                    >
                      Approve Reschedule
                    </Button>
                    <Button 
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'reject', 'reschedule')}
                      className="bg-[#7B1113] text-white hover:bg-[#7B1113]/90"
                    >
                      Reject Reschedule
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'cancellation-pending' && (
                  <>
                    <Button 
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'approve', 'cancel')}
                      className="bg-[#014421] text-white hover:bg-[#014421]/90"
                    >
                      Approve Cancellation
                    </Button>
                    <Button 
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'reject', 'cancel')}
                      className="bg-[#7B1113] text-white hover:bg-[#7B1113]/90"
                    >
                      Reject Cancellation
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
      {message.text && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
          message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentSettings;