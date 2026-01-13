-- CreateTable: demos
-- Stores unreleased tracks (demos) that artists send to DJs
CREATE TABLE "demos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "artist_name" VARCHAR(255) NOT NULL,
    "genre" VARCHAR(100),
    "bpm" INTEGER,
    "key" VARCHAR(10),
    "file_url" TEXT NOT NULL,
    "artwork_url" TEXT,
    "waveform_url" TEXT,
    "duration_seconds" INTEGER,
    "release_date" DATE,
    "notes" TEXT,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "demos_bpm_check" CHECK ("bpm" IS NULL OR ("bpm" >= 60 AND "bpm" <= 200)),
    CONSTRAINT "demos_title_not_empty" CHECK (LENGTH(TRIM("title")) > 0),
    CONSTRAINT "demos_artist_not_empty" CHECK (LENGTH(TRIM("artist_name")) > 0),
    CONSTRAINT "demos_file_url_not_empty" CHECK (LENGTH(TRIM("file_url")) > 0)
);

-- CreateTable: demo_sends
-- Tracks demo emails sent to DJs (one row per send)
CREATE TABLE "demo_sends" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "demo_id" UUID NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email_subject" VARCHAR(500) NOT NULL,
    "email_body_html" TEXT NOT NULL,
    "personal_note" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "sent_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(6),
    "clicked_at" TIMESTAMP(6),
    "resend_email_id" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_sends_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demo_sends_demo_id_fkey" FOREIGN KEY ("demo_id") REFERENCES "demos"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "demo_sends_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "demo_sends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "demo_sends_status_check" CHECK ("status" IN ('sent', 'opened', 'clicked')),
    CONSTRAINT "demo_sends_opened_after_sent" CHECK ("opened_at" IS NULL OR "opened_at" >= "sent_at"),
    CONSTRAINT "demo_sends_clicked_after_sent" CHECK ("clicked_at" IS NULL OR "clicked_at" >= "sent_at")
);

-- CreateTable: demo_supports
-- Manual tracking of DJ support (plays, features, etc)
CREATE TABLE "demo_supports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "demo_id" UUID NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "support_type" VARCHAR(50) NOT NULL,
    "platform" VARCHAR(255),
    "event_name" VARCHAR(500),
    "played_at" TIMESTAMP(6),
    "proof_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_supports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demo_supports_demo_id_fkey" FOREIGN KEY ("demo_id") REFERENCES "demos"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "demo_supports_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "demo_supports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "demo_supports_type_check" CHECK ("support_type" IN ('radio', 'dj_set', 'playlist', 'social_media', 'podcast', 'other')),
    CONSTRAINT "demo_supports_played_at_not_future" CHECK ("played_at" IS NULL OR "played_at" <= CURRENT_TIMESTAMP)
);

-- CreateIndex: demos indexes
CREATE INDEX "idx_demos_user_id" ON "demos"("user_id");
CREATE INDEX "idx_demos_active" ON "demos"("active") WHERE "active" = true;
CREATE INDEX "idx_demos_genre" ON "demos"("genre") WHERE "genre" IS NOT NULL;
CREATE INDEX "idx_demos_created_at" ON "demos"("created_at" DESC);

-- CreateIndex: demo_sends indexes
CREATE INDEX "idx_demo_sends_demo_id" ON "demo_sends"("demo_id");
CREATE INDEX "idx_demo_sends_contact_id" ON "demo_sends"("contact_id");
CREATE INDEX "idx_demo_sends_user_id" ON "demo_sends"("user_id");
CREATE INDEX "idx_demo_sends_status" ON "demo_sends"("status");
CREATE INDEX "idx_demo_sends_sent_at" ON "demo_sends"("sent_at" DESC);

-- CreateIndex: demo_sends unique constraint (prevent duplicate sends)
CREATE UNIQUE INDEX "demo_sends_demo_id_contact_id_key" ON "demo_sends"("demo_id", "contact_id");

-- CreateIndex: demo_supports indexes
CREATE INDEX "idx_demo_supports_demo_id" ON "demo_supports"("demo_id");
CREATE INDEX "idx_demo_supports_contact_id" ON "demo_supports"("contact_id");
CREATE INDEX "idx_demo_supports_user_id" ON "demo_supports"("user_id");
CREATE INDEX "idx_demo_supports_support_type" ON "demo_supports"("support_type");
CREATE INDEX "idx_demo_supports_played_at" ON "demo_supports"("played_at" DESC);

-- CreateIndex: contacts metadata indexes for DJ filtering
-- GIN index for JSONB array containment queries (metadata->'types' ? 'dj')
CREATE INDEX "idx_contacts_metadata_types" ON "contacts" USING GIN (("metadata"->'types'));

-- Index for email source filtering (metadata->'djMetadata'->>'emailSource')
CREATE INDEX "idx_contacts_metadata_dj_email_source" ON "contacts"(("metadata"->'djMetadata'->>'emailSource'))
WHERE "metadata"->'djMetadata' IS NOT NULL;

-- Comment on contacts table documenting metadata structure
COMMENT ON TABLE "contacts" IS 'metadata JSONB structure for DJ contacts:
{
  "types": ["fan", "dj"],  // Contact can be both fan and DJ
  "djMetadata": {
    "emailSource": "networking",  // MANDATORY for DJ type (GDPR compliance)
    "genres": ["house", "techno"],
    "platforms": ["soundcloud", "mixcloud"],
    "location": "Berlin",
    "followersCount": 5000,
    "notes": "Plays at Berghain"
  }
}';

-- Comment on demos table
COMMENT ON TABLE "demos" IS 'Unreleased tracks (demos) that artists send to DJs for feedback and promotion';

-- Comment on demo_sends table
COMMENT ON TABLE "demo_sends" IS 'Tracks individual demo emails sent to DJs with open/click tracking';

-- Comment on demo_supports table
COMMENT ON TABLE "demo_supports" IS 'Manual tracking of DJ support (radio plays, DJ sets, playlists, social media)';
