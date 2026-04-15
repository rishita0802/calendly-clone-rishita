-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventTypeId" TEXT NOT NULL,
    "inviteeName" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EventType_slug_key" ON "EventType"("slug");
