import { useState } from "react";

const AdminAppointmentSettings = () => {
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [interval, setInterval] = useState(30);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Handle saving consultation time settings
  const handleSaveSettings = () => {
    // This would be replaced with an actual API call
    console.log("Saving settings:", { startTime, endTime, interval });
    setMessage({ text: "Settings saved successfully!", type: "success" });

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 3000);
  };

  // Add a blocked date
  const handleAddBlockedDate = () => {
    if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
      setBlockedDates([...blockedDates, newBlockedDate]);
      setNewBlockedDate("");
    }
  };

  // Remove a blocked date
  const handleRemoveBlockedDate = (date) => {
    setBlockedDates(blockedDates.filter(d => d !== date));
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
  const toggleTimeSlot = (slot) => {
    if (blockedTimeSlots.includes(slot)) {
      setBlockedTimeSlots(blockedTimeSlots.filter(s => s !== slot));
    } else {
      setBlockedTimeSlots([...blockedTimeSlots, slot]);
    }
  };

  const timeSlots = generateTimeSlots();

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
            className="p-2 bg-[#7B1113] hover:bg-[#5e0d0e] text-white rounded-md"
            onClick={handleSaveSettings}
          >
            Save Settings
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
              className="p-2 bg-[#7B1113] hover:bg-[#5e0d0e] text-white rounded-r-md"
              onClick={handleAddBlockedDate}
            >
              Add
            </button>
          </div>
          
          {blockedDates.length > 0 ? (
            <ul className="space-y-2">
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