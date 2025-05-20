import { useState, useEffect } from "react";
import supabase from "../../lib/supabase";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";
import { Check, X } from "lucide-react";

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
  const [currentUser, setCurrentUser] = useState(null);

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

  // Add useEffect to get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: accountData } = await supabase
            .from('account')
            .select('account_id')
            .eq('email', user.email)
            .single();
          
          if (accountData) {
            setCurrentUser(accountData);
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
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
          reason,
          other_reason,
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
    if (!currentUser?.account_id) {
      toast.error("You must be logged in to save settings");
      return;
    }

    try {
      setSavingSettings(true);
      
      const { error } = await supabase
        .from('appointment_settings')
        .upsert({
          id: 1,
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          interval_minutes: interval,
          updated_by: currentUser.account_id,
          created_by: currentUser.account_id // Only set on insert
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
    if (!currentUser?.account_id) {
      toast.error("You must be logged in to block dates");
      return;
    }

    if (!newBlockedDate || blockedDates.includes(newBlockedDate)) {
      return;
    }
    
    try {
      setAddingDate(true);
      
      // Insert new blocked date into the database
      const { error } = await supabase
        .from('blocked_slots')
        .insert({ 
          block_date: newBlockedDate,
          created_by: currentUser.account_id 
        });
      
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
    if (!currentUser?.account_id) {
      toast.error("You must be logged in to modify time slots");
      return;
    }

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
          .insert({ 
            block_time: formattedTime,
            created_by: currentUser.account_id 
          });
        
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
      const { error } = await supabase
        .from('appointments')
        .update({
          status: action === 'confirm' ? 'confirmed' : 'rejected',
          admin_notes: adminComment,
          updated_at: new Date()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Send confirmation email
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${appointmentId}/send-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: adminComment,
          status: action === 'confirm' ? 'confirmed' : 'rejected'
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
      <h1 className="text-2xl font-bold text-[#7B1113] mb-6">Appointment Management</h1>

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
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Time</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center w-[200px]">Student</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Reason</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center w-[140px]">Mode</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Contact</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center w-[180px]">Status</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm text-gray-700 text-center">{new Date(appointment.appointment_date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 text-center">
                          {new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 text-center w-[200px] whitespace-nowrap">{appointment.account?.account_name}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 text-center">{appointment.reason}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 text-center w-[140px] whitespace-nowrap">{appointment.meeting_mode || "Face-to-face"}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 text-center">
                          <div className="flex flex-col items-center">
                            <div>{appointment.contact_number}</div>
                            <div className="text-sm text-gray-500">{appointment.email}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 text-center w-[180px]">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            appointment.status === "confirmed" ? "bg-green-100 text-green-700" :
                            appointment.status === "rejected" ? "bg-red-100 text-red-700" :
                            appointment.status === "reschedule-pending" ? "bg-blue-100 text-blue-700" :
                            appointment.status === "cancellation-pending" ? "bg-amber-100 text-amber-700" :
                            appointment.status === "scheduled" ? "bg-gray-100 text-gray-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {appointment.status === "confirmed" ? "Confirmed" :
                             appointment.status === "rejected" ? "Rejected" :
                             appointment.status === "reschedule-pending" ? "Reschedule Requested" :
                             appointment.status === "cancellation-pending" ? "Cancellation Requested" :
                             appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-center">
                          {appointment.status === 'scheduled' && (
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowConfirmDialog(true);
                                }}
                                className="px-3 py-1.5 bg-green-50 text-green-600 hover:text-green-800 rounded-lg text-sm font-medium"
                                title="Confirm Appointment"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowRejectDialog(true);
                                }}
                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:text-red-800 rounded-lg text-sm font-medium"
                                title="Reject Appointment"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {appointment.status === 'reschedule-pending' && (
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'approve', 'reschedule')}
                                className="px-3 py-1.5 bg-green-50 text-green-600 hover:text-green-800 rounded-lg text-sm font-medium"
                                title="Approve Reschedule"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'reject', 'reschedule')}
                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:text-red-800 rounded-lg text-sm font-medium"
                                title="Reject Reschedule"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {appointment.status === 'cancellation-pending' && (
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'approve', 'cancel')}
                                className="px-3 py-1.5 bg-green-50 text-green-600 hover:text-green-800 rounded-lg text-sm font-medium"
                                title="Approve Cancellation"
                              >
                                Approve 
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'reject', 'cancel')}
                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:text-red-800 rounded-lg text-sm font-medium"
                                title="Reject Cancellation"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
                      <div key={date} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-md">
                        <span className="text-red-700">{new Date(date).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleRemoveBlockedDate(date)}
                          className="text-red-600 hover:text-red-800"
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
                          ? "bg-[#7B1113]/10 text-[#7B1113] border-[#7B1113]/20" 
                          : "bg-green-100 text-green-700 border-green-300"
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Add any additional comments or instructions for the user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="E.g., Please arrive 10 minutes early..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAppointmentResponse(selectedAppointment?.id, 'confirm')}
              className="bg-[#007749] text-white hover:bg-[#006638]"
            >
              Confirm Appointment
            </Button>
          </DialogFooter>
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