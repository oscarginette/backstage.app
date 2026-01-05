-- CreateTable
CREATE TABLE "email_signatures" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "logo_url" VARCHAR(500),
    "custom_text" VARCHAR(500),
    "social_links" JSONB NOT NULL DEFAULT '[]',
    "default_to_geebeat" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "email_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_signatures_user_id_key" ON "email_signatures"("user_id");

-- CreateIndex
CREATE INDEX "idx_email_signatures_user_id" ON "email_signatures"("user_id");

-- AddForeignKey
ALTER TABLE "email_signatures" ADD CONSTRAINT "email_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
