/*
  Warnings:

  - The primary key for the `Availability` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Availability` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to drop the column `createdAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Booking` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Availability" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL
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
    CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("endTime", "eventTypeId", "id", "inviteeEmail", "inviteeName", "startTime") SELECT "endTime", "eventTypeId", "id", "inviteeEmail", "inviteeName", "startTime" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
