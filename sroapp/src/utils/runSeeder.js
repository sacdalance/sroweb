import { generateSampleAppointments, clearSampleAppointments } from './seedAppointments';

// Run the seeder
(async () => {
  try {
    await generateSampleAppointments();
    console.log('Seed completed!');
  } catch (error) {
    console.error('Error running seed:', error);
  }
})(); 