-- CreateTable
CREATE TABLE "spotify_auto_save_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submission_id" UUID NOT NULL,
    "spotify_user_id" VARCHAR(255) NOT NULL,
    "artist_user_id" INTEGER NOT NULL,
    "artist_spotify_id" VARCHAR(255) NOT NULL,
    "access_token_encrypted" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(6) NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "last_check_at" TIMESTAMP(6),
    "next_check_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spotify_auto_save_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spotify_saved_releases" (
    "id" SERIAL NOT NULL,
    "subscription_id" UUID NOT NULL,
    "release_type" VARCHAR(50) NOT NULL,
    "spotify_album_id" VARCHAR(255) NOT NULL,
    "spotify_track_ids" TEXT[],
    "album_name" VARCHAR(500) NOT NULL,
    "release_date" DATE NOT NULL,
    "saved_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "save_status" VARCHAR(50) DEFAULT 'success',
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spotify_saved_releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spotify_auto_save_subscriptions_spotify_user_id_artist_spo_key" ON "spotify_auto_save_subscriptions"("spotify_user_id", "artist_spotify_id");

-- CreateIndex
CREATE INDEX "idx_spotify_auto_save_active" ON "spotify_auto_save_subscriptions"("active", "next_check_at");

-- CreateIndex
CREATE INDEX "idx_spotify_auto_save_artist" ON "spotify_auto_save_subscriptions"("artist_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_saved_releases_subscription_id_spotify_album_id_key" ON "spotify_saved_releases"("subscription_id", "spotify_album_id");

-- CreateIndex
CREATE INDEX "idx_spotify_saved_releases_subscription" ON "spotify_saved_releases"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_spotify_saved_releases_date" ON "spotify_saved_releases"("release_date" DESC);

-- AddForeignKey
ALTER TABLE "spotify_auto_save_subscriptions" ADD CONSTRAINT "spotify_auto_save_subscriptions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "download_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "spotify_auto_save_subscriptions" ADD CONSTRAINT "spotify_auto_save_subscriptions_artist_user_id_fkey" FOREIGN KEY ("artist_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "spotify_saved_releases" ADD CONSTRAINT "spotify_saved_releases_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "spotify_auto_save_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
