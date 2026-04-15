const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing old data...");
  await prisma.booking.deleteMany();
  await prisma.dateOverride.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.eventType.deleteMany();

  console.log("📦 Creating Event Types...");

  // 1. Morning Coffee Chat
  const coffee = await prisma.eventType.create({
    data: {
      title: 'Morning Coffee Chat',
      duration: 15,
      slug: 'coffee-' + Date.now(),
      description: 'Quick 15-min catchup.',
      beforeBuffer: 5,
      afterBuffer: 5,
      isActive: true,
      customQuestions: JSON.stringify(["What kind of coffee do you like?"])
    }
  });

  // 2. Standard Consultation
  const work = await prisma.eventType.create({
    data: {
      title: 'Standard Consultation',
      duration: 30,
      slug: 'consult-' + Date.now(),
      description: 'Professional meeting.',
      beforeBuffer: 10,
      afterBuffer: 10,
      isActive: true
    }
  });

  // 3. Weekend Tech Support
  const weekend = await prisma.eventType.create({
    data: {
      title: 'Weekend Tech Support',
      duration: 60,
      slug: 'weekend-' + Date.now(),
      description: 'Special support for weekends.',
      beforeBuffer: 15,
      afterBuffer: 15,
      isActive: true
    }
  });

  console.log("🕒 Adding Availabilities...");

 const weekDays = [1, 2, 3, 4, 5];

  const weekendDays = [6, 0];
  for (const day of weekDays) {
    // ✅ Morning Coffee Chat: 9:00 AM to 11:00 AM ONLY
    await prisma.availability.create({
      data: { 
        dayOfWeek: day, 
        startTime: "09:00", 
        endTime: "11:00", 
        eventTypeId: coffee.id 
      }
    });

    // ✅ Standard Consultation: 09:00 AM to 05:00 PM (17:00)
    await prisma.availability.create({
      data: { 
        dayOfWeek: day, 
        startTime: "09:00", 
        endTime: "17:00", 
        eventTypeId: work.id 
      }
    });
  }

  for (const day of weekendDays) {
    // Weekend Tech Support: 10:00 AM to 02:00 PM (14:00)
    await prisma.availability.create({
      data: {
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "14:00",
        eventTypeId: weekend.id
      }
    });
  }

  // Date override example
  await prisma.dateOverride.create({
    data: {
      date: "2026-12-25",
      startTime: "10:00",
      endTime: "12:00",
      eventTypeId: work.id
    }
  });

  console.log("✅ Seed successful! Coffee Chat is now 9-11 AM Mon-Fri.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });