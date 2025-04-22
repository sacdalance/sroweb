import supabase from '../lib/supabase';
import { format, addDays, addBusinessDays, isWeekend } from 'date-fns';

// Function to generate appointments for the next 14 business days
export const generateSampleAppointments = async () => {
  try {
    // Get a sample user account to associate appointments with
    const { data: accounts, error: accountError } = await supabase
      .from('account')
      .select('account_id, email')
      .limit(5);
    
    if (accountError) throw accountError;
    
    // Create default account if none found (for testing purposes)
    let accountsToUse = accounts;
    if (!accounts || accounts.length === 0) {
      console.warn('No user accounts found, using default test account');
      accountsToUse = [{
        account_id: 1, // Default ID for testing
        email: 'test@up.edu.ph' // Default email for testing
      }];
    }
    
    // Sample purposes
    const purposes = [
      'Consultation',
      'Organization Registration',
      'Event Approval',
      'Other'
    ];
    
    // Sample meeting modes
    const meetingModes = [
      'Face-to-face',
      'Online (Google Meet)'
    ];
    
    // Sample time slots
    const timeSlots = [
      '09:00',
      '10:00',
      '11:00',
      '13:00',
      '14:00',
      '15:00'
    ];
    
    // Generate appointments for next 14 business days
    const today = new Date();
    const appointments = [];
    
    // Create some appointments with different statuses
    for (let i = 0; i < 10; i++) {
      // Randomly pick a user
      const randomUser = accountsToUse[Math.floor(Math.random() * accountsToUse.length)];
      
      // Calculate a random future date (1-14 business days from now)
      let daysToAdd = Math.floor(Math.random() * 14) + 1;
      let appointmentDate = addBusinessDays(today, daysToAdd);
      
      // Skip weekends
      while (isWeekend(appointmentDate)) {
        appointmentDate = addDays(appointmentDate, 1);
      }
      
      // Format date
      const dateStr = format(appointmentDate, 'yyyy-MM-dd');
      
      // Random selections
      const purpose = purposes[Math.floor(Math.random() * purposes.length)];
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const meetingMode = meetingModes[Math.floor(Math.random() * meetingModes.length)];
      
      // Randomly assign a status (70% confirmed, 20% pending, 10% rejected)
      const statusRand = Math.random();
      let status;
      if (statusRand < 0.7) {
        status = 'confirmed';
      } else if (statusRand < 0.9) {
        status = 'pending';
      } else {
        status = 'rejected';
      }
      
      appointments.push({
        user_id: randomUser.account_id,
        date: dateStr,
        time_slot: timeSlot,
        purpose: purpose,
        details: purpose === 'Other' ? 'Custom appointment reason details' : null,
        email: randomUser.email,
        contact_number: '09123456789',
        meeting_mode: meetingMode,
        status: status,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    if (appointments.length === 0) {
      console.log('No appointments generated');
      return;
    }
    
    // Insert appointments into database
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointments)
      .select();
    
    if (error) throw error;
    
    console.log(`Successfully added ${data.length} sample appointments`);
    return data;
  } catch (error) {
    console.error('Error generating sample appointments:', error);
    throw error; // Rethrow to handle in UI
  }
};

// Function to clear all sample appointments (use with caution!)
export const clearSampleAppointments = async () => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .neq('id', 0);  // This will delete all rows
    
    if (error) throw error;
    
    console.log('Successfully cleared all appointments');
  } catch (error) {
    console.error('Error clearing appointments:', error);
  }
}; 