/*
  Warnings:

  - The primary key for the `Availability` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bufferAfter` on the `EventType` table. All the data in the column will be lost.
  - You are about to drop the column `bufferBefore` on the `EventType` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `EventType` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `EventType` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EventType` table. All the data in the column will be lost.
  - Added the required column `eventTypeId` to the `Availability` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "DateOverride" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    CONSTRAINT "DateOverride_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventTypeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    CONSTRAINT "Availability_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Availability" ("dayOfWeek", "endTime", "id", "startTime") SELECT "dayOfWeek", "endTime", "id", "startTime" FROM "Availability";
DROP TABLE "Availability";
ALTER TABLE "new_Availability" RENAME TO "Availability";
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventTypeId" TEXT NOT NULL,
    "inviteeName" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "customAnswers" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("endTime", "eventTypeId", "id", "inviteeEmail", "inviteeName", "startTime") SELECT "endTime", "eventTypeId", "id", "inviteeEmail", "inviteeName", "startTime" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE TABLE "new_EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "bufferTime" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_EventType" ("description", "duration", "id", "slug", "title") SELECT "description", "duration", "id", "slug", "title" FROM "EventType";
DROP TABLE "EventType";
ALTER TABLE "new_EventType" RENAME TO "EventType";
CREATE UNIQUE INDEX "EventType_slug_key" ON "EventType"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
