-- AlterTable
ALTER TABLE "download_submissions"
ADD COLUMN "spotify_follow_completed" BOOLEAN DEFAULT false,
ADD COLUMN "spotify_follow_completed_at" TIMESTAMP(6);
