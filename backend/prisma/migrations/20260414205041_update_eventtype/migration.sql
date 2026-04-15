/*
  Warnings:

  - You are about to drop the column `bufferTime` on the `EventType` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "beforeBuffer" INTEGER NOT NULL DEFAULT 0,
    "afterBuffer" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customQuestions" TEXT
);
INSERT INTO "new_EventType" ("description", "duration", "id", "slug", "title") SELECT "description", "duration", "id", "slug", "title" FROM "EventType";
DROP TABLE "EventType";
ALTER TABLE "new_EventType" RENAME TO "EventType";
CREATE UNIQUE INDEX "EventType_slug_key" ON "EventType"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
