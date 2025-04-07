import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AppointmentBooking = () => {
  const [formData, setFormData] = useState({
    reason: "",
    otherReason: "",
    date: null,
    time: null,
    notes: ""
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const reasons = [
    "Organization Recognition",
    "Consultation",
    "Other"
  ];

  // Load blocked dates (would be from API in real application)
  useEffect(() => {
    // Mock blocked dates - would be fetched from API
    const mockBlockedDates = [
      new Date(2023, 5, 3),
      new Date(2023, 5, 7),
      new Date(2023, 5, 15),
      new Date(2023, 5, 21),
      new Date(2023, 5, 29)
    ];
    setBlockedDates(mockBlockedDates);
  }, []);

  // Handle reason selection
  const handleReasonSelect = (e) => {
    setFormData({ ...formData, reason: e.target.value });
    // Reset otherReason when reason changes
    if (e.target.value !== "Other") {
      setFormData({ ...formData, reason: e.target.value, otherReason: "" });
    }
  };

  // Handle other reason input
  const handleOtherReasonChange = (e) => {
    setFormData({ ...formData, otherReason: e.target.value });
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setError("");
    setFormData({ ...formData, date });
    
    // Mock API response - in reality, fetch available times for the selected date
    // Here we're simulating consultation hours from 8am to 4pm with 30min slots
    const mockAvailableTimes = [];
    let currentTime = new Date(date);
    currentTime.setHours(8, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(16, 0, 0);
    
    while (currentTime < endTime) {
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      
      // Skip lunch hour (12pm-1pm)
      if (currentTime.getHours() !== 12) {
        mockAvailableTimes.push(timeString);
      }
      
      // Increment by 30 minutes
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }
    
    setAvailableTimes(mockAvailableTimes);
  };

  // Handle time selection
  const handleTimeSelect = (e) => {
    setFormData({ ...formData, time: e.target.value });
  };

  // Handle notes change
  const handleNotesChange = (e) => {
    setFormData({ ...formData, notes: e.target.value });
  };

  // Submit the appointment
  const handleSubmit = () => {
    // This would be replaced with an actual API call
    console.log("Submitting appointment:", formData);
    // Simulate successful submission
    setSuccess(true);
    setShowConfirmation(false);
  };

  // Reset form and start over
  const handleReset = () => {
    setFormData({
      reason: "",
      otherReason: "",
      date: null,
      time: null,
      notes: ""
    });
    setSuccess(false);
    setError("");
  };

  // Filter out weekends and blocked dates
  const isDateBlocked = (date) => {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    
    // Check if date is in blocked dates
    const isBlocked = blockedDates.some(blockedDate => 
      date.getDate() === blockedDate.getDate() && 
      date.getMonth() === blockedDate.getMonth() && 
      date.getFullYear() === blockedDate.getFullYear()
    );
    
    return isWeekend || isBlocked;
  };

  // Calculate max date (2 weeks from today)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  // Check if form is valid for submission
  const isFormValid = () => {
    if (formData.reason === "Other") {
      return formData.reason && formData.otherReason.trim() && formData.date && formData.time;
    } else {
      return formData.reason && formData.date && formData.time;
    }
  };

  // Custom styles for DatePicker
  const calendarStyles = `
    .react-datepicker {
      font-family: inherit;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      width: 100%;
    }
    .react-datepicker__header {
      background-color: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      padding-top: 0.5rem;
    }
    .react-datepicker__navigation {
      top: 0.75rem;
    }
    .react-datepicker__day--selected {
      background-color: #9B2242 !important;
      border-radius: 0.375rem;
      font-weight: bold;
    }
    .react-datepicker__day--today {
      font-weight: bold;
      color: #9B2242;
    }
    .react-datepicker__day:hover {
      background-color: #f3f4f6;
      border-radius: 0.375rem;
    }
    .react-datepicker__day--keyboard-selected {
      background-color: rgba(155, 34, 66, 0.2);
    }
    .react-datepicker__day {
      margin: 0.2rem;
      border-radius: 0.375rem;
      transition: all 0.15s ease-in-out;
    }
    .react-datepicker__month-container {
      width: 100%;
    }
    .react-datepicker__month {
      margin: 0.5rem;
      padding: 0.5rem 0;
    }
    .react-datepicker__current-month {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .react-datepicker__day-name {
      margin: 0.2rem;
      color: #666;
      font-weight: 500;
    }
  `;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${showConfirmation ? 'pointer-events-none' : ''}`}>
      <style>{calendarStyles}</style>
      <h1 className="text-2xl font-bold mb-6">Book an Appointment with SRO</h1>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
          Appointment booked successfully! We look forward to meeting with you.
        </div>
      )}

      <div className="space-y-6">
        {/* Reason Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What is the reason for your appointment?
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.reason}
            onChange={handleReasonSelect}
          >
            <option value="">Select a reason</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        {/* Other Reason Input (appears when "Other" is selected) */}
        {formData.reason === "Other" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please specify your reason
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="Please specify your reason for the appointment"
              value={formData.otherReason}
              onChange={handleOtherReasonChange}
            />
          </div>
        )}

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a date for your appointment
          </label>
          <p className="text-sm text-gray-600 mb-2">
            Available dates for the next two weeks. Weekends and red dates are not available.
          </p>
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <DatePicker
                selected={formData.date}
                onChange={handleDateSelect}
                minDate={new Date()}
                maxDate={maxDate}
                filterDate={date => !isDateBlocked(date)}
                inline
                className="w-full"
                dayClassName={date => 
                  isDateBlocked(date) ? "text-red-500" : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Time Selection */}
        {formData.date && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a time for your appointment
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.time}
              onChange={handleTimeSelect}
            >
              <option value="">Select a time</option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows="4"
            placeholder="Add any additional information that might be helpful..."
            value={formData.notes}
            onChange={handleNotesChange}
          ></textarea>
        </div>

        {/* Book Appointment Button */}
        <button
          className="p-2 bg-[#9B2242] text-white rounded-md"
          onClick={() => setShowConfirmation(true)}
          disabled={!isFormValid()}
        >
          Book Appointment
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Confirm Your Appointment</h2>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="mb-2">
                <span className="font-semibold">Reason:</span> {formData.reason}
                {formData.reason === "Other" && formData.otherReason && (
                  <span> - {formData.otherReason}</span>
                )}
              </div>
              <div className="mb-2"><span className="font-semibold">Date:</span> {formData.date?.toLocaleDateString()}</div>
              <div className="mb-2"><span className="font-semibold">Time:</span> {formData.time}</div>
              {formData.notes && (
                <div className="mb-2">
                  <span className="font-semibold">Notes:</span> 
                  <p className="text-gray-700">{formData.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="p-2 bg-gray-200 rounded-md"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="p-2 bg-[#9B2242] text-white rounded-md"
                onClick={handleSubmit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking; 