-- AlterTable
ALTER TABLE "download_gates" ADD COLUMN     "instagram_profile_url" VARCHAR(500),
ADD COLUMN     "require_instagram_follow" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "download_submissions" ADD COLUMN     "instagram_click_tracked" BOOLEAN DEFAULT false,
ADD COLUMN     "instagram_click_tracked_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "instagram_url" VARCHAR(500),
ADD COLUMN     "reset_password_token" VARCHAR(64),
ADD COLUMN     "reset_password_token_expires_at" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "idx_demos_active" ON "demos"("active");

-- CreateIndex
CREATE INDEX "idx_demos_genre" ON "demos"("genre");

-- CreateIndex
CREATE INDEX "idx_users_reset_password_token" ON "users"("reset_password_token");

-- RenameIndex
ALTER INDEX "spotify_auto_save_subscriptions_spotify_user_id_artist_spo_key" RENAME TO "spotify_auto_save_subscriptions_spotify_user_id_artist_spot_key";
