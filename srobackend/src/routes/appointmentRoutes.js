import express from 'express';
import { supabase } from '../supabaseClient.js';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const router = express.Router();

// Get appointment settings
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointment_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    return res.status(200).json(data[0] || {});
  } catch (error) {
    console.error('Error fetching appointment settings:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update or insert appointment settings
router.post('/settings', async (req, res) => {
  try {
    const { 
      allowed_days, 
      start_time, 
      end_time, 
      appointment_duration, 
      max_appointments_per_day 
    } = req.body;

    // Validate required fields
    if (!allowed_days || !start_time || !end_time || !appointment_duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('appointment_settings')
      .upsert({
        allowed_days,
        start_time,
        end_time,
        appointment_duration,
        max_appointments_per_day,
        updated_at: new Date()
      })
      .select();

    if (error) throw error;
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error updating appointment settings:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get all blocked dates
router.get('/blocked-dates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Add a new blocked date
router.post('/blocked-dates', async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const { data, error } = await supabase
      .from('blocked_dates')
      .insert({ date, reason })
      .select();

    if (error) throw error;
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error adding blocked date:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete a blocked date
router.delete('/blocked-dates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return res.status(200).json({ message: 'Blocked date deleted successfully' });
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get all blocked time slots
router.get('/blocked-time-slots', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blocked_time_slots')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching blocked time slots:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Add a new blocked time slot
router.post('/blocked-time-slots', async (req, res) => {
  try {
    const { date, start_time, end_time, reason } = req.body;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Date, start time, and end time are required' });
    }

    const { data, error } = await supabase
      .from('blocked_time_slots')
      .insert({ date, start_time, end_time, reason })
      .select();

    if (error) throw error;
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error adding blocked time slot:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete a blocked time slot
router.delete('/blocked-time-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('blocked_time_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return res.status(200).json({ message: 'Blocked time slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting blocked time slot:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get appointments (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { date, status, user_id } = req.query;
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `);
    
    if (date) {
      query = query.eq('date', date);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get a specific appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Create a new appointment
router.post('/', async (req, res) => {
  try {
    const { 
      user_id, 
      date, 
      time_slot, 
      purpose,
      details 
    } = req.body;

    // Validate required fields
    if (!user_id || !date || !time_slot || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if date is blocked
    const { data: blockedDate, error: blockedDateError } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('date', date)
      .single();

    if (blockedDateError && blockedDateError.code !== 'PGRST116') {
      throw blockedDateError;
    }

    if (blockedDate) {
      return res.status(400).json({ 
        error: 'This date is blocked for appointments',
        reason: blockedDate.reason
      });
    }

    // Check if time slot is blocked
    const { data: blockedTimeSlot, error: blockedTimeSlotError } = await supabase
      .from('blocked_time_slots')
      .select('*')
      .eq('date', date)
      .lte('start_time', time_slot)
      .gte('end_time', time_slot)
      .single();

    if (blockedTimeSlotError && blockedTimeSlotError.code !== 'PGRST116') {
      throw blockedTimeSlotError;
    }

    if (blockedTimeSlot) {
      return res.status(400).json({ 
        error: 'This time slot is blocked',
        reason: blockedTimeSlot.reason
      });
    }

    // Check if there's already an appointment at this time
    const { data: existingAppointment, error: existingAppointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .eq('time_slot', time_slot)
      .eq('status', 'confirmed')
      .single();

    if (existingAppointmentError && existingAppointmentError.code !== 'PGRST116') {
      throw existingAppointmentError;
    }

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    // Count appointments for this day to enforce max_appointments_per_day
    const { data: settings, error: settingsError } = await supabase
      .from('appointment_settings')
      .select('max_appointments_per_day')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError) throw settingsError;

    if (settings && settings.max_appointments_per_day) {
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('date', date)
        .eq('status', 'confirmed');

      if (countError) throw countError;

      if (count >= settings.max_appointments_per_day) {
        return res.status(400).json({ error: 'Maximum number of appointments for this day has been reached' });
      }
    }

    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id,
        date,
        time_slot,
        purpose,
        details,
        status: 'pending' // Default status
      })
      .select();

    if (error) throw error;
    
    // Get user information for email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', user_id)
      .single();
    
    if (userError) {
      console.error('Error fetching user data for email:', userError);
    } else if (user) {
      // Send email confirmation to user
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your Appointment Request Confirmation',
        text: `
          Thank you for scheduling an appointment.
          
          Date: ${date}
          Time: ${time_slot}
          Purpose: ${purpose}
          
          Your appointment is currently pending approval. You will receive another email once it has been confirmed.
        `,
        html: `
          <h2>Your Appointment Request Confirmation</h2>
          <p>Thank you for scheduling an appointment.</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time_slot}</p>
          <p><strong>Purpose:</strong> ${purpose}</p>
          <p>Your appointment is currently pending approval. You will receive another email once it has been confirmed.</p>
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending user confirmation email:', emailError);
      }
      
      // Send notification to admin
      const adminEmailData = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Appointment Request',
        text: `
          A new appointment request has been submitted.
          
          User: ${user.first_name} ${user.last_name} (${user.email})
          Date: ${date}
          Time: ${time_slot}
          Purpose: ${purpose}
          
          Please review this request in the admin dashboard.
        `,
        html: `
          <h2>New Appointment Request</h2>
          <p>A new appointment request has been submitted.</p>
          <p><strong>User:</strong> ${user.first_name} ${user.last_name} (${user.email})</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time_slot}</p>
          <p><strong>Purpose:</strong> ${purpose}</p>
          <p>Please review this request in the admin dashboard.</p>
        `
      };
      
      try {
        await transporter.sendMail(adminEmailData);
      } catch (emailError) {
        console.error('Error sending admin notification email:', emailError);
      }
    }
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided' });
    }

    // Get current appointment data for notification
    const { data: currentAppointment, error: currentAppError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (currentAppError) throw currentAppError;
    
    if (!currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updateData = { 
      status, 
      updated_at: new Date() 
    };

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Send notification email to user on status change
    if (currentAppointment.users && currentAppointment.users.email) {
      let subject, message;
      
      switch(status) {
        case 'confirmed':
          subject = 'Your Appointment Has Been Confirmed';
          message = `
            <h2>Your Appointment Has Been Confirmed</h2>
            <p>Your appointment has been confirmed for:</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        case 'cancelled':
          subject = 'Your Appointment Has Been Cancelled';
          message = `
            <h2>Your Appointment Has Been Cancelled</h2>
            <p>Your appointment for the following date and time has been cancelled:</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        case 'completed':
          subject = 'Your Appointment Has Been Completed';
          message = `
            <h2>Your Appointment Has Been Completed</h2>
            <p>Thank you for attending your appointment.</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        case 'no-show':
          subject = 'Missed Appointment Notice';
          message = `
            <h2>Missed Appointment Notice</h2>
            <p>Our records indicate that you missed your scheduled appointment:</p>
            <p><strong>Date:</strong> ${currentAppointment.date}</p>
            <p><strong>Time:</strong> ${currentAppointment.time_slot}</p>
            <p>If you need to reschedule, please make a new appointment through the system.</p>
            ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
          `;
          break;
        default:
          // No email for other status changes
          break;
      }
      
      if (subject && message) {
        const userEmailData = {
          from: process.env.EMAIL_USER,
          to: currentAppointment.users.email,
          subject: subject,
          html: message,
          text: message.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };
        
        try {
          await transporter.sendMail(userEmailData);
        } catch (emailError) {
          console.error('Error sending status update email:', emailError);
        }
      }
    }

    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get available time slots for a specific date
router.get('/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Get appointment settings
    const { data: settings, error: settingsError } = await supabase
      .from('appointment_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError) throw settingsError;
    
    if (!settings) {
      return res.status(400).json({ error: 'Appointment settings not configured' });
    }
    
    // Check if date is in allowed days
    const dayOfWeek = new Date(date).getDay();
    const allowedDays = settings.allowed_days || [];

    if (!allowedDays.includes(dayOfWeek)) {
      return res.status(400).json({ error: 'Appointments are not available on this day' });
    }
    
    // Check if date is blocked
    const { data: blockedDate, error: blockedDateError } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('date', date)
      .single();

    if (blockedDate) {
      return res.status(400).json({ 
        error: 'This date is blocked for appointments',
        reason: blockedDate.reason
      });
    }
    
    // Generate all possible time slots based on settings
    const { start_time, end_time, appointment_duration } = settings;
    
    const startHour = parseInt(start_time.split(':')[0]);
    const startMinute = parseInt(start_time.split(':')[1]);
    const endHour = parseInt(end_time.split(':')[0]);
    const endMinute = parseInt(end_time.split(':')[1]);
    
    let allSlots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      allSlots.push(timeString);
      
      // Add duration to current time
      currentMinute += appointment_duration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    // Get all confirmed appointments for this date
    const { data: bookedAppointments, error: bookedError } = await supabase
      .from('appointments')
      .select('time_slot')
      .eq('date', date)
      .in('status', ['confirmed', 'pending']);
      
    if (bookedError) throw bookedError;
    
    const bookedSlots = bookedAppointments.map(app => app.time_slot);
    
    // Get all blocked time slots for this date
    const { data: blockedSlots, error: blockedSlotsError } = await supabase
      .from('blocked_time_slots')
      .select('*')
      .eq('date', date);
      
    if (blockedSlotsError) throw blockedSlotsError;
    
    // Filter out booked and blocked slots
    const availableSlots = allSlots.filter(slot => {
      // Check if slot is already booked
      if (bookedSlots.includes(slot)) return false;
      
      // Check if slot falls within any blocked time range
      for (const blockedSlot of blockedSlots) {
        if (slot >= blockedSlot.start_time && slot <= blockedSlot.end_time) {
          return false;
        }
      }
      
      return true;
    });
    
    // Count total confirmed appointments for the day
    const { count, error: countError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('date', date)
      .eq('status', 'confirmed');
      
    if (countError) throw countError;
    
    // Check if max appointments for the day is reached
    const maxReached = settings.max_appointments_per_day && count >= settings.max_appointments_per_day;
    
    return res.status(200).json({
      availableSlots,
      bookedSlots,
      blockedSlots: blockedSlots.map(b => ({ start: b.start_time, end: b.end_time, reason: b.reason })),
      maxAppointmentsReached: maxReached
    });
    
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Request to reschedule an appointment
router.post('/:id/reschedule-request', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_date, new_time_slot, reason } = req.body;
    
    if (!new_date || !new_time_slot) {
      return res.status(400).json({ error: 'New date and time slot are required' });
    }
    
    // Check if the appointment exists and belongs to the user
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if appointment is already cancelled or completed
    if (['cancelled', 'completed', 'no-show'].includes(appointment.status)) {
      return res.status(400).json({ 
        error: `Cannot reschedule an appointment with status: ${appointment.status}` 
      });
    }
    
    // Check if new date is blocked
    const { data: blockedDate } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('date', new_date)
      .single();
      
    if (blockedDate) {
      return res.status(400).json({ 
        error: 'The requested date is blocked for appointments',
        reason: blockedDate.reason
      });
    }
    
    // Check if new time slot is blocked
    const { data: blockedTimeSlot } = await supabase
      .from('blocked_time_slots')
      .select('*')
      .eq('date', new_date)
      .lte('start_time', new_time_slot)
      .gte('end_time', new_time_slot)
      .single();
      
    if (blockedTimeSlot) {
      return res.status(400).json({ 
        error: 'The requested time slot is blocked',
        reason: blockedTimeSlot.reason
      });
    }
    
    // Check if there's already an appointment at this time
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', new_date)
      .eq('time_slot', new_time_slot)
      .eq('status', 'confirmed')
      .single();
      
    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    
    // Update the appointment with the reschedule request
    const { data, error } = await supabase
      .from('appointments')
      .update({
        reschedule_requested: true,
        requested_date: new_date,
        requested_time_slot: new_time_slot,
        reschedule_reason: reason,
        status: 'reschedule-pending',
        updated_at: new Date()
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notification to admin
    const adminEmailData = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Appointment Reschedule Request',
      text: `
        An appointment reschedule has been requested.
        
        User: ${appointment.users.first_name} ${appointment.users.last_name} (${appointment.users.email})
        Original Date: ${appointment.date}
        Original Time: ${appointment.time_slot}
        Requested Date: ${new_date}
        Requested Time: ${new_time_slot}
        Reason: ${reason || 'No reason provided'}
        
        Please review this request in the admin dashboard.
      `,
      html: `
        <h2>Appointment Reschedule Request</h2>
        <p><strong>User:</strong> ${appointment.users.first_name} ${appointment.users.last_name} (${appointment.users.email})</p>
        <p><strong>Original Date:</strong> ${appointment.date}</p>
        <p><strong>Original Time:</strong> ${appointment.time_slot}</p>
        <p><strong>Requested Date:</strong> ${new_date}</p>
        <p><strong>Requested Time:</strong> ${new_time_slot}</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <p>Please review this request in the admin dashboard.</p>
      `
    };
    
    try {
      await transporter.sendMail(adminEmailData);
    } catch (emailError) {
      console.error('Error sending admin email notification:', emailError);
      // Continue with the response even if email fails
    }
    
    // Send confirmation email to user
    if (appointment.users && appointment.users.email) {
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: appointment.users.email,
        subject: 'Your Appointment Reschedule Request',
        text: `
          Your appointment reschedule request has been received and is pending approval.
          
          Original Date: ${appointment.date}
          Original Time: ${appointment.time_slot}
          Requested Date: ${new_date}
          Requested Time: ${new_time_slot}
          
          You will receive another email once your request has been processed.
        `,
        html: `
          <h2>Your Appointment Reschedule Request</h2>
          <p>Your appointment reschedule request has been received and is pending approval.</p>
          <p><strong>Original Date:</strong> ${appointment.date}</p>
          <p><strong>Original Time:</strong> ${appointment.time_slot}</p>
          <p><strong>Requested Date:</strong> ${new_date}</p>
          <p><strong>Requested Time:</strong> ${new_time_slot}</p>
          <p>You will receive another email once your request has been processed.</p>
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending user email notification:', emailError);
        // Continue with the response even if email fails
      }
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error requesting appointment reschedule:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Admin approve/reject reschedule request
router.patch('/:id/reschedule-decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, admin_notes } = req.body;
    
    // Get the appointment with reschedule request
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (!appointment.reschedule_requested) {
      return res.status(400).json({ error: 'This appointment has no reschedule request' });
    }
    
    let updateData = {
      reschedule_requested: false,
      admin_notes: admin_notes || appointment.admin_notes,
      updated_at: new Date()
    };
    
    if (approved) {
      // If approved, update with the requested date and time
      updateData = {
        ...updateData,
        date: appointment.requested_date,
        time_slot: appointment.requested_time_slot,
        requested_date: null,
        requested_time_slot: null,
        reschedule_reason: null,
        status: 'confirmed'
      };
    } else {
      // If rejected, revert to original status
      updateData = {
        ...updateData,
        requested_date: null,
        requested_time_slot: null,
        reschedule_reason: null,
        status: 'confirmed' // back to confirmed status
      };
    }
    
    // Update the appointment
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notification to user
    if (appointment.users && appointment.users.email) {
      const decision = approved ? 'approved' : 'rejected';
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: appointment.users.email,
        subject: `Your Appointment Reschedule Request has been ${approved ? 'Approved' : 'Rejected'}`,
        text: `
          Your appointment reschedule request has been ${decision}.
          
          ${approved ? `
          Your appointment has been rescheduled to:
          Date: ${appointment.requested_date}
          Time: ${appointment.requested_time_slot}
          ` : `
          Your appointment remains as originally scheduled:
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          `}
          
          ${admin_notes ? `Notes: ${admin_notes}` : ''}
        `,
        html: `
          <h2>Your Appointment Reschedule Request</h2>
          <p>Your appointment reschedule request has been <strong>${decision}</strong>.</p>
          
          ${approved ? `
          <p>Your appointment has been rescheduled to:</p>
          <p><strong>Date:</strong> ${appointment.requested_date}</p>
          <p><strong>Time:</strong> ${appointment.requested_time_slot}</p>
          ` : `
          <p>Your appointment remains as originally scheduled:</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          `}
          
          ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error processing reschedule decision:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Request to cancel an appointment
router.post('/:id/cancellation-request', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }
    
    // Check if the appointment exists
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if appointment is already cancelled or completed
    if (['cancelled', 'completed', 'no-show'].includes(appointment.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel an appointment with status: ${appointment.status}` 
      });
    }
    
    // Update the appointment with the cancellation request
    const { data, error } = await supabase
      .from('appointments')
      .update({
        cancellation_requested: true,
        cancellation_reason: reason,
        status: 'cancellation-pending',
        updated_at: new Date()
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notification to admin
    const adminEmailData = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Appointment Cancellation Request',
      text: `
        An appointment cancellation has been requested.
        
        User: ${appointment.users.first_name} ${appointment.users.last_name} (${appointment.users.email})
        Date: ${appointment.date}
        Time: ${appointment.time_slot}
        Reason: ${reason}
        
        Please review this request in the admin dashboard.
      `,
      html: `
        <h2>Appointment Cancellation Request</h2>
        <p><strong>User:</strong> ${appointment.users.first_name} ${appointment.users.last_name} (${appointment.users.email})</p>
        <p><strong>Date:</strong> ${appointment.date}</p>
        <p><strong>Time:</strong> ${appointment.time_slot}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please review this request in the admin dashboard.</p>
      `
    };
    
    try {
      await transporter.sendMail(adminEmailData);
    } catch (emailError) {
      console.error('Error sending admin email notification:', emailError);
      // Continue with the response even if email fails
    }
    
    // Send confirmation email to user
    if (appointment.users && appointment.users.email) {
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: appointment.users.email,
        subject: 'Your Appointment Cancellation Request',
        text: `
          Your appointment cancellation request has been received and is pending approval.
          
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          
          You will receive another email once your request has been processed.
        `,
        html: `
          <h2>Your Appointment Cancellation Request</h2>
          <p>Your appointment cancellation request has been received and is pending approval.</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          <p>You will receive another email once your request has been processed.</p>
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending user email notification:', emailError);
        // Continue with the response even if email fails
      }
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error requesting appointment cancellation:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Admin approve/reject cancellation request
router.patch('/:id/cancellation-decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, admin_notes } = req.body;
    
    // Get the appointment with cancellation request
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        users (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (!appointment.cancellation_requested) {
      return res.status(400).json({ error: 'This appointment has no cancellation request' });
    }
    
    let updateData = {
      cancellation_requested: false,
      admin_notes: admin_notes || appointment.admin_notes,
      updated_at: new Date()
    };
    
    if (approved) {
      // If approved, mark as cancelled
      updateData = {
        ...updateData,
        cancellation_reason: appointment.cancellation_reason, // Keep the reason
        status: 'cancelled'
      };
    } else {
      // If rejected, revert to original status
      updateData = {
        ...updateData,
        cancellation_reason: null,
        status: 'confirmed' // back to confirmed status
      };
    }
    
    // Update the appointment
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Send email notification to user
    if (appointment.users && appointment.users.email) {
      const decision = approved ? 'approved' : 'rejected';
      const userEmailData = {
        from: process.env.EMAIL_USER,
        to: appointment.users.email,
        subject: `Your Appointment Cancellation Request has been ${approved ? 'Approved' : 'Rejected'}`,
        text: `
          Your appointment cancellation request has been ${decision}.
          
          ${approved ? `
          Your appointment for the following date and time has been cancelled:
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          ` : `
          Your appointment remains as scheduled:
          Date: ${appointment.date}
          Time: ${appointment.time_slot}
          `}
          
          ${admin_notes ? `Notes: ${admin_notes}` : ''}
        `,
        html: `
          <h2>Your Appointment Cancellation Request</h2>
          <p>Your appointment cancellation request has been <strong>${decision}</strong>.</p>
          
          ${approved ? `
          <p>Your appointment for the following date and time has been cancelled:</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          ` : `
          <p>Your appointment remains as scheduled:</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time_slot}</p>
          `}
          
          ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
        `
      };
      
      try {
        await transporter.sendMail(userEmailData);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }
    
    return res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error processing cancellation decision:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router; 