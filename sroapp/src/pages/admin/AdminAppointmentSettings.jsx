import { useState, useEffect } from "react";
import supabase from "../../lib/supabase";
import { Spinner } from "@/components/ui/spinner";

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
  const [showAppointments, setShowAppointments] = useState(false);

  // Load settings and blocked dates/times from the database
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
        
        // Get blocked dates
        const { data: blockedDatesData, error: blockedDatesError } = await supabase
          .from('blocked_dates')
          .select('*');
        
        if (blockedDatesError) throw blockedDatesError;
        
        const formattedDates = blockedDatesData.map(item => item.date);
        setBlockedDates(formattedDates);
        
        // Get blocked time slots
        const { data: blockedSlotsData, error: blockedSlotsError } = await supabase
          .from('blocked_time_slots')
          .select('*');
        
        if (blockedSlotsError) throw blockedSlotsError;
        
        const formattedSlots = blockedSlotsData.map(item => {
          const time = new Date(`2000-01-01T${item.time_slot}`);
          return time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          });
        });
        
        setBlockedTimeSlots(formattedSlots);
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

  // Load upcoming appointments
  const loadAppointments = async () => {
    try {
      setShowAppointments(true);
      
      // Get current date
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      // Get upcoming appointments
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          reason,
          other_reason,
          appointment_date,
          appointment_time,
          account:account(account_name, email),
          status
        `)
        .gte('appointment_date', formattedDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      
      setAppointments(data);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setMessage({ 
        text: "Failed to load appointments", 
        type: "error" 
      });
    }
  };

  // Handle saving consultation time settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      
      // Update settings in the database
      const { data, error } = await supabase
        .from('appointment_settings')
        .upsert({
          id: 1, // Use a single row for settings
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          interval_minutes: interval
        });
      
      if (error) throw error;
      
      setMessage({ text: "Settings saved successfully!", type: "success" });
      setSavingSettings(false);
      
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
      const { data, error } = await supabase
        .from('blocked_dates')
        .insert({ date: newBlockedDate });
      
      if (error) throw error;
      
      setBlockedDates([...blockedDates, newBlockedDate]);
      setNewBlockedDate("");
      setAddingDate(false);
      
      // Show success message
      setMessage({ text: "Date blocked successfully!", type: "success" });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error adding blocked date:", error);
      setMessage({ 
        text: "Failed to block date. Please try again.", 
        type: "error" 
      });
      setAddingDate(false);
    }
  };

  // Remove a blocked date
  const handleRemoveBlockedDate = async (date) => {
    try {
      // Remove blocked date from the database
      const { data, error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('date', date);
      
      if (error) throw error;
      
      setBlockedDates(blockedDates.filter(d => d !== date));
      
      // Show success message
      setMessage({ text: "Date unblocked successfully!", type: "success" });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
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
        const { data, error } = await supabase
          .from('blocked_time_slots')
          .delete()
          .eq('time_slot', formattedTime);
        
        if (error) throw error;
        
        setBlockedTimeSlots(blockedTimeSlots.filter(s => s !== slot));
      } else {
        // Block the time slot
        const { data, error } = await supabase
          .from('blocked_time_slots')
          .insert({ time_slot: formattedTime });
        
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

  // Update appointment status
  const updateAppointmentStatus = async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status } : app
      ));
      
      // Show success message
      setMessage({ text: "Appointment updated successfully!", type: "success" });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating appointment:", error);
      setMessage({ 
        text: "Failed to update appointment. Please try again.", 
        type: "error" 
      });
    }
  };

  // Send a confirmation email to the user
  const sendConfirmationEmail = async (appointment) => {
    try {
      // Get API URL based on current hostname
      const apiHost = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : `https://api.${window.location.hostname}`;
      
      // Format the appointment time and date for display
      const time = new Date(`2000-01-01T${appointment.appointment_time}`);
      const formattedTime = time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      
      const date = new Date(appointment.appointment_date);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Show confirmation dialog with email form
      const confirmationNote = prompt(
        `Enter any notes for the confirmation email to ${appointment.account?.email} for ${formattedDate} at ${formattedTime}:`,
        `Your appointment for ${appointment.reason} has been confirmed.`
      );
      
      if (confirmationNote === null) {
        // User cancelled the prompt
        return;
      }
      
      setMessage({ text: "Sending confirmation email...", type: "info" });
      
      // Get the auth token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }
      
      // Make API call to send confirmation email
      const response = await fetch(`${apiHost}/api/appointments/${appointment.id}/send-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: confirmationNote,
          status: 'confirmed' // Always set status to confirmed
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send confirmation email');
      }
      
      // Update local state if the status was changed
      setAppointments(appointments.map(app => 
        app.id === appointment.id ? { ...app, status: 'confirmed' } : app
      ));
      
      setMessage({ text: "Confirmation email sent successfully!", type: "success" });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      setMessage({ 
        text: `Failed to send confirmation email: ${error.message}`, 
        type: "error" 
      });
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Appointment Settings</h1>
      
      {message.text && (
        <div className={`p-3 mb-4 rounded-md ${
          message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="mb-6">
        <button 
          className="p-2 bg-[#7B1113] hover:bg-[#5e0d0e] text-white rounded-md mb-6"
          onClick={loadAppointments}
        >
          {showAppointments ? "Refresh" : "View"} Upcoming Appointments
        </button>
        
        {showAppointments && (
          <div className="bg-white p-4 rounded-md shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
            
            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-3 text-left">Date</th>
                      <th className="py-2 px-3 text-left">Time</th>
                      <th className="py-2 px-3 text-left">Name</th>
                      <th className="py-2 px-3 text-left">Email</th>
                      <th className="py-2 px-3 text-left">Reason</th>
                      <th className="py-2 px-3 text-left">Status</th>
                      <th className="py-2 px-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointments.map(appointment => {
                      // Format time for display
                      const time = new Date(`2000-01-01T${appointment.appointment_time}`);
                      const formattedTime = time.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                      });
                      
                      // Format date for display
                      const date = new Date(appointment.appointment_date);
                      const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                      
                      return (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3">{formattedDate}</td>
                          <td className="py-2 px-3">{formattedTime}</td>
                          <td className="py-2 px-3">{appointment.account?.account_name}</td>
                          <td className="py-2 px-3">{appointment.account?.email}</td>
                          <td className="py-2 px-3">
                            {appointment.reason === "Other" 
                              ? appointment.other_reason 
                              : appointment.reason}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              appointment.status === 'scheduled' 
                                ? 'bg-blue-100 text-blue-800' 
                                : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex space-x-2">
                              {appointment.status === 'scheduled' && (
                                <>
                                  <button
                                    className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                  >
                                    Complete
                                  </button>
                                  <button
                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                                    onClick={() => sendConfirmationEmail(appointment)}
                                    title="Send confirmation email to user"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                                    </svg>
                                    Confirm via Email
                                  </button>
                                </>
                              )}
                              {appointment.status === 'cancelled' && (
                                <button
                                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                                >
                                  Reschedule
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No upcoming appointments</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consultation Hours Settings */}
        <div className="bg-white p-4 rounded-md shadow">
          <h2 className="text-xl font-semibold mb-4">Consultation Hours</h2>
          
          <div className="mb-4">
            <label className="block mb-1">Start Time</label>
            <input 
              type="time" 
              className="w-full p-2 border rounded-md"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">End Time</label>
            <input 
              type="time" 
              className="w-full p-2 border rounded-md"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Time Slot Interval (minutes)</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          
          <button 
            className="p-2 bg-[#7B1113] hover:bg-[#5e0d0e] text-white rounded-md flex items-center"
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
        
        {/* Blocked Dates */}
        <div className="bg-white p-4 rounded-md shadow">
          <h2 className="text-xl font-semibold mb-4">Blocked Dates</h2>
          <p className="text-gray-600 mb-4">Block specific dates when no appointments can be booked</p>
          
          <div className="flex mb-4">
            <input 
              type="date" 
              className="flex-1 p-2 border rounded-l-md"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
            />
            <button 
              className="p-2 bg-[#7B1113] hover:bg-[#5e0d0e] text-white rounded-r-md flex items-center"
              onClick={handleAddBlockedDate}
              disabled={addingDate || !newBlockedDate}
            >
              {addingDate ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </button>
          </div>
          
          {blockedDates.length > 0 ? (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {blockedDates.map((date) => (
                <li key={date} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  {new Date(date).toLocaleDateString()}
                  <button 
                    className="text-[#7B1113] hover:text-[#5e0d0e]"
                    onClick={() => handleRemoveBlockedDate(date)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No blocked dates</p>
          )}
        </div>
      </div>
      
      {/* Time Slot Management */}
      <div className="mt-6 bg-white p-4 rounded-md shadow">
        <h2 className="text-xl font-semibold mb-4">Manage Time Slots</h2>
        <p className="text-gray-600 mb-4">Click on time slots to block/unblock them globally</p>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              className={`p-2 border rounded-md ${
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
    </div>
  );
};

export default AdminAppointmentSettings; 