import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Dhruv', 'Kabir', 'Ananya', 'Diya', 'Advika', 'Jiya', 'Sana', 'Avni', 'Riya', 'Kriti', 'Neha', 'Pooja', 'Rahul', 'Rohit', 'Sneha', 'Karan', 'Priya', 'Vikram', 'Rohan', 'Amit', 'Sunil', 'Anita', 'Kavita', 'Sanjay', 'Rajesh', 'Prakash', 'Deepak', 'Nisha'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Rao', 'Das', 'Roy', 'Joshi', 'Tiwari', 'Yadav', 'Mishra', 'Pandey', 'Chauhan', 'Nair', 'Menon', 'Bose', 'Iyer', 'Mehta', 'Jain', 'Bhatia', 'Deshmukh', 'Kulkarni', 'Naidu'];
const colleges = ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'NIT Trichy', 'NIT Surathkal', 'NIT Warangal', 'BITS Pilani', 'BITS Goa', 'VIT Vellore', 'SRM University', 'Delhi University', 'Anna University', 'Jadavpur University', 'Thapar Institute', 'Manipal Institute', 'PEC Chandigarh', 'IIIT Hyderabad', 'IIIT Delhi', 'DTU Delhi', 'NSUT Delhi'];

function randomName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${l}`;
}

// Box-Muller transform for normal distribution
function randomNormal(min: number, max: number, skew = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); 
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randomNormal(min, max, skew); // resample
  num = Math.pow(num, skew); // skew
  num *= max - min; // stretch to fill range
  num += min; // offset to min
  return new Date(num);
}

async function main() {
  console.log('Cleaning up old mock data completely...');
  await prisma.foodEntry.deleteMany();
  await prisma.scanEvent.deleteMany();
  await prisma.qrCard.deleteMany();
  await prisma.guest.deleteMany({
    where: { OR: [{ email: { endsWith: '@example.com' } }, { email: { endsWith: '@mock.in' } }] }
  });
  await prisma.foodSlot.deleteMany();
  await prisma.foodDay.deleteMany();
  await prisma.activityLog.deleteMany();

  // 1. Create a few volunteers to simulate different gates/scanners
  let admin = await prisma.volunteer.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.volunteer.create({
      data: { name: 'Super Admin', username: 'admin', passwordHash: 'mock', role: 'ADMIN' }
    });
  }

  const vol1 = await prisma.volunteer.upsert({
    where: { username: 'vol1' }, update: {}, create: { name: 'Gate 1 Scanner', username: 'vol1', passwordHash: 'mock', role: 'VOLUNTEER' }
  });
  const vol2 = await prisma.volunteer.upsert({
    where: { username: 'vol2' }, update: {}, create: { name: 'Gate 2 Scanner', username: 'vol2', passwordHash: 'mock', role: 'VOLUNTEER' }
  });
  const volunteers = [admin, vol1, vol2];

  const numGuests = 850;
  console.log(`Creating ${numGuests} highly realistic mock guests...`);
  
  const guestsToCreate = Array.from({ length: numGuests }).map((_, i) => ({
    name: randomName(),
    college: colleges[Math.floor(Math.random() * colleges.length)],
    contactNo: `99${(i + 1).toString().padStart(8, '0')}`, // 10 digit
    email: `student${i + 1}@mock.in`,
    status: i < 750 ? 'ASSIGNED' : 'UNASSIGNED',
  }));

  await prisma.guest.createMany({ data: guestsToCreate });
  
  const createdGuests = await prisma.guest.findMany({
    where: { email: { endsWith: '@mock.in' } }
  });
  
  console.log(`Creating QR Cards...`);
  const assignedGuests = createdGuests.filter(g => g.status === 'ASSIGNED');
  await prisma.qrCard.createMany({
    data: assignedGuests.map((g, i) => ({
      uid: `SHR-${2026}-${(i + 1).toString().padStart(4, '0')}`,
      status: 'ASSIGNED',
      guestId: g.id
    }))
  });

  console.log('Creating Full 3-Day Schedule (Breakfast, Lunch, Snacks, Dinner)...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day1D = new Date(today); day1D.setDate(day1D.getDate() - 1); // Yesterday
  const day2D = new Date(today); // Today
  const day3D = new Date(today); day3D.setDate(day3D.getDate() + 1); // Tomorrow

  const days = await Promise.all([
    prisma.foodDay.create({ data: { label: 'Day 1 (Inauguration)', eventDate: day1D } }),
    prisma.foodDay.create({ data: { label: 'Day 2 (Main Events)', eventDate: day2D } }),
    prisma.foodDay.create({ data: { label: 'Day 3 (Valedictory)', eventDate: day3D } }),
  ]);

  const slotsToCreate: any[] = [];
  for (const day of days) {
    const isPast = day.eventDate < today;
    const isToday = day.eventDate.getTime() === today.getTime();
    
    // Breakfast: 7:30 AM - 9:30 AM
    const bfStart = new Date(day.eventDate); bfStart.setHours(7, 30, 0, 0);
    const bfEnd = new Date(day.eventDate); bfEnd.setHours(9, 30, 0, 0);
    // Lunch: 12:30 PM - 3:30 PM
    const lStart = new Date(day.eventDate); lStart.setHours(12, 30, 0, 0);
    const lEnd = new Date(day.eventDate); lEnd.setHours(15, 30, 0, 0);
    // Snacks: 5:00 PM - 6:30 PM
    const sStart = new Date(day.eventDate); sStart.setHours(17, 0, 0, 0);
    const sEnd = new Date(day.eventDate); sEnd.setHours(18, 30, 0, 0);
    // Dinner: 8:00 PM - 11:00 PM
    const dStart = new Date(day.eventDate); dStart.setHours(20, 0, 0, 0);
    const dEnd = new Date(day.eventDate); dEnd.setHours(23, 0, 0, 0);

    slotsToCreate.push({ title: 'Breakfast', startTime: bfStart, endTime: bfEnd, dayId: day.id, status: isPast ? 'CLOSED' : 'SCHEDULED' });
    slotsToCreate.push({ title: 'Lunch', startTime: lStart, endTime: lEnd, dayId: day.id, status: isPast ? 'CLOSED' : 'SCHEDULED' });
    slotsToCreate.push({ title: 'Snacks', startTime: sStart, endTime: sEnd, dayId: day.id, status: isPast ? 'CLOSED' : 'SCHEDULED' });
    slotsToCreate.push({ title: 'Dinner', startTime: dStart, endTime: dEnd, dayId: day.id, status: isPast ? 'CLOSED' : 'SCHEDULED' });
  }

  // Set Today's Lunch to ACTIVE for demonstration
  // Set Today's Lunch to ACTIVE for demonstration
  const todayLunchIndex = slotsToCreate.findIndex(s => s.dayId === days[1].id && s.title === 'Lunch');
  if (todayLunchIndex !== -1) slotsToCreate[todayLunchIndex].status = 'ACTIVE';

  // We will generate data for ALL slots to fill the dashboard completely.
  await prisma.foodSlot.createMany({ data: slotsToCreate });
  const allSlots = await prisma.foodSlot.findMany({ orderBy: { startTime: 'asc' } });

  console.log('Simulating thousands of organic meal scans (Normal Distribution)...');
  
  const entriesData: any[] = [];
  
  // Participation drop-off logic
  const baseRates = {
    'Breakfast': 0.65,
    'Lunch': 0.95,
    'Snacks': 0.45,
    'Dinner': 0.85
  };

  for (const slot of allSlots) {
    const baseRate = baseRates[slot.title as keyof typeof baseRates];
    // Add ±15% randomness to make every day look different
    const randomizedRate = baseRate * (0.85 + Math.random() * 0.30);
    // Ensure it doesn't exceed 100%
    const finalRate = Math.min(randomizedRate, 1);
    
    const totalToServe = Math.floor(assignedGuests.length * finalRate);
    
    // Pick random guests who ate this meal
    const ateGuests = [...assignedGuests].sort(() => 0.5 - Math.random()).slice(0, totalToServe);
    
    for (const g of ateGuests) {
      // Pick a random volunteer scanner
      const vol = volunteers[Math.floor(Math.random() * volunteers.length)];
      
      // Generate a scan time using normal distribution around the middle of the slot
      let scanTime = randomNormal(slot.startTime.getTime(), slot.endTime.getTime(), 1); 
      
      entriesData.push({
        guestId: g.id,
        slotId: slot.id,
        volunteerId: vol.id,
        scannedAt: scanTime
      });
    }
  }

  entriesData.sort((a, b) => a.scannedAt.getTime() - b.scannedAt.getTime());
  
  // Insert in chunks to avoid overwhelming sqlite/pg bindings
  const chunkSize = 1000;
  for (let i = 0; i < entriesData.length; i += chunkSize) {
    await prisma.foodEntry.createMany({ data: entriesData.slice(i, i + chunkSize) });
  }

  console.log(`Successfully generated ${entriesData.length} highly realistic food entries!`);
  console.log('✅ Real Mock Setup Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
