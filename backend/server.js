const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 10000;

// CORS settings
app.use(cors()); // Temporary: Sabko allow karo testing ke liye
app.use(express.json());

// 1. Debug Route: Ye check karega ki routes register hue ya nahi
// Base route
app.get('/', (req, res) => {
  res.send("Server is LIVE and Routes are defined! 🚀");
});

// Bilkul simple bina kisi complex logic ke
app.get('/api/test', (req, res) => {
  res.json({ status: "success" });
});

// --- EVENT TYPES ---
app.get('/api/event-types', async (req, res) => {
    try {
        const data = await prisma.eventType.findMany({ 
            include: { availability: true } 
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Example Backend Code
app.post('/api/event-types', async (req, res) => {
  const { title, duration, slug, description } = req.body;
  try {
    const newEvent = await prisma.eventType.create({
      data: {
        title,
        duration,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'), // Use payload slug if available
        description
      }
    });
    res.json(newEvent);
  } catch (error) {
    if (error.code === 'P2002') { // Prisma unique constraint error
      return res.status(400).json({ error: 'Slug must be unique' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/event-types/:id', async (req, res) => {
    await prisma.eventType.delete({ where: { id: req.params.id } });
    res.sendStatus(200);
});

// --- AVAILABILITY & SETTINGS ---
app.get('/api/availability/:eventTypeId', async (req, res) => {
    const availability = await prisma.availability.findMany({ where: { eventTypeId: req.params.eventTypeId } });
    const overrides = await prisma.dateOverride.findMany({ where: { eventTypeId: req.params.eventTypeId } });
    res.json({ availability, overrides });
});

app.post('/api/availability', async (req, res) => {
    const { eventTypeId, startTime, endTime, dayOfWeek } = req.body;
    const dayInt = parseInt(dayOfWeek);
    // Purana setting delete karke naya dalo (Clean approach)
    await prisma.availability.deleteMany({ where: { eventTypeId, dayOfWeek: dayInt } });
    const result = await prisma.availability.create({
        data: { eventTypeId, startTime, endTime, dayOfWeek: dayInt }
    });
    res.json(result);
});

// --- BOOKINGS & RESCHEDULE ---
app.post('/api/bookings', async (req, res) => {
    const { eventTypeId, inviteeName, inviteeEmail, startTime, duration, customAnswers, rescheduleId } = req.body; // Added rescheduleId
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (parseInt(duration) || 30) * 60000);

    try {
        // ✅ IMPROVED DOUBLE BOOKING CHECK
        const existing = await prisma.booking.findFirst({
            where: {
                startTime: start,
                eventTypeId: eventTypeId,
                // Agar rescheduleId hai, toh check karo ki koi AUR banda toh booked nahi hai
                NOT: rescheduleId ? { id: rescheduleId } : undefined 
            }
        });

        if (existing) {
            return res.status(400).json({ error: "This slot is already booked!" });
        }

        // Transaction use karna better hai (Taki agar ek fail ho toh dusra na chale)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Purani meeting delete karo agar reschedule ho raha hai
            if (rescheduleId) {
                await tx.booking.delete({ where: { id: rescheduleId } });
            }

            // 2. Nayi meeting create karo
            return await tx.booking.create({
                data: { 
                    eventTypeId, 
                    inviteeName, 
                    inviteeEmail, 
                    startTime: start, 
                    endTime: end, 
                    customAnswers 
                },
                include: { eventType: true }
            });
        });

        res.json(result);
    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).json({ error: "Booking failed. Slot might have been taken." });
    }
});

// --- ISSE REPLACE KARO ---
app.get('/api/bookings', async (req, res) => {
    const data = await prisma.booking.findMany({ 
        include: { 
            eventType: {
                include: {
                    availability: true // 👈 YEH LINE SABSE ZARURI HAI
                }
            } 
        }, 
        orderBy: { startTime: 'asc' } 
    });
    res.json(data);
});

app.delete('/api/bookings/:id', async (req, res) => {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.sendStatus(200);
});
// Update Event Type Details
app.put('/api/event-types/:id', async (req, res) => {
    const { title, duration, bufferTime } = req.body;
    try {
        const updated = await prisma.eventType.update({
            where: { id: req.params.id },
            data: { 
                title, 
                duration: parseInt(duration), 
                // bufferTime ki jagah wo naam likho jo schema mein hai (likely afterBuffer)
                afterBuffer: parseInt(bufferTime || 0) 
            }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Update failed." });
    }
});
app.listen(PORT, () => console.log(`Server is running on port ${PORT} 🚀`));