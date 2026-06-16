-- Allow demo/content seeds to create public event data without creating login credentials.
ALTER TABLE "events" DROP CONSTRAINT "events_hostId_fkey";
ALTER TABLE "events" ALTER COLUMN "hostId" DROP NOT NULL;
ALTER TABLE "events" ADD CONSTRAINT "events_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
