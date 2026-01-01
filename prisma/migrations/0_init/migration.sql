-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "app_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brevo_import_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "contacts_fetched" INTEGER DEFAULT 0,
    "contacts_inserted" INTEGER DEFAULT 0,
    "contacts_updated" INTEGER DEFAULT 0,
    "contacts_skipped" INTEGER DEFAULT 0,
    "lists_processed" INTEGER DEFAULT 0,
    "status" VARCHAR(50) DEFAULT 'pending',
    "started_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "errors_detail" JSONB,
    "metadata" JSONB,
    "preview_used" BOOLEAN DEFAULT false,

    CONSTRAINT "brevo_import_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brevo_integrations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "account_email" VARCHAR(255),
    "account_name" VARCHAR(255),
    "company_name" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "last_sync_at" TIMESTAMP(6),
    "last_error" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brevo_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "contact_id" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(100),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "consent_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_import_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "original_filename" VARCHAR(500) NOT NULL,
    "file_size_bytes" INTEGER,
    "file_type" VARCHAR(20) NOT NULL,
    "rows_total" INTEGER DEFAULT 0,
    "contacts_inserted" INTEGER DEFAULT 0,
    "contacts_updated" INTEGER DEFAULT 0,
    "contacts_skipped" INTEGER DEFAULT 0,
    "column_mapping" JSONB,
    "status" VARCHAR(50) DEFAULT 'pending',
    "started_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "errors_detail" JSONB,

    CONSTRAINT "contact_import_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "source" VARCHAR(100) DEFAULT 'hypedit',
    "subscribed" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMP(6),
    "unsubscribe_token" VARCHAR(64),
    "metadata" JSONB,
    "brevo_list_ids" INTEGER[],
    "brevo_id" VARCHAR(255),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_gate_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gate_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "session_id" VARCHAR(255),
    "submission_id" UUID,
    "referrer" TEXT,
    "utm_source" VARCHAR(255),
    "utm_medium" VARCHAR(255),
    "utm_campaign" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "country" VARCHAR(2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_gate_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_gates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" INTEGER NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "artist_name" VARCHAR(255),
    "genre" VARCHAR(100),
    "description" TEXT,
    "artwork_url" TEXT,
    "soundcloud_track_id" VARCHAR(255),
    "soundcloud_track_url" TEXT,
    "soundcloud_user_id" VARCHAR(255),
    "file_url" TEXT NOT NULL,
    "file_size_mb" DECIMAL(10,2),
    "file_type" VARCHAR(50),
    "require_email" BOOLEAN DEFAULT true,
    "require_soundcloud_repost" BOOLEAN DEFAULT true,
    "require_soundcloud_follow" BOOLEAN DEFAULT false,
    "require_spotify_connect" BOOLEAN DEFAULT false,
    "active" BOOLEAN DEFAULT true,
    "max_downloads" INTEGER,
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gate_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255),
    "soundcloud_user_id" VARCHAR(255),
    "soundcloud_username" VARCHAR(255),
    "soundcloud_permalink" VARCHAR(255),
    "spotify_user_id" VARCHAR(255),
    "spotify_display_name" VARCHAR(255),
    "email_verified" BOOLEAN DEFAULT false,
    "soundcloud_repost_verified" BOOLEAN DEFAULT false,
    "soundcloud_repost_verified_at" TIMESTAMP(6),
    "soundcloud_follow_verified" BOOLEAN DEFAULT false,
    "soundcloud_follow_verified_at" TIMESTAMP(6),
    "spotify_connected" BOOLEAN DEFAULT false,
    "spotify_connected_at" TIMESTAMP(6),
    "download_token" VARCHAR(255),
    "download_token_generated_at" TIMESTAMP(6),
    "download_token_expires_at" TIMESTAMP(6),
    "download_completed" BOOLEAN DEFAULT false,
    "download_completed_at" TIMESTAMP(6),
    "consent_marketing" BOOLEAN DEFAULT true,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "template_id" INTEGER,
    "track_id" VARCHAR(500),
    "subject" VARCHAR(500) NOT NULL,
    "html_content" TEXT NOT NULL,
    "status" VARCHAR(20) DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(6),
    "sent_at" TIMESTAMP(6),
    "recipients_count" INTEGER DEFAULT 0,
    "opened_count" INTEGER DEFAULT 0,
    "clicked_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "email_log_id" INTEGER,
    "event_type" VARCHAR(50) NOT NULL,
    "event_data" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "contact_id" INTEGER,
    "campaign_id" INTEGER,
    "track_id" VARCHAR(500),
    "sent_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "resend_email_id" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'sent',
    "error" TEXT,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "html_content" TEXT NOT NULL,
    "variables" JSONB DEFAULT '[]',
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" VARCHAR(255) NOT NULL,
    "object" VARCHAR(50) NOT NULL DEFAULT 'event',
    "type" VARCHAR(100) NOT NULL,
    "data_object_id" VARCHAR(255),
    "data_object_type" VARCHAR(50),
    "data" JSONB NOT NULL,
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "api_version" VARCHAR(20) DEFAULT '2025-01-01',
    "pending_webhooks" INTEGER DEFAULT 0,
    "request_id" VARCHAR(255),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "executed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "new_tracks" INTEGER DEFAULT 0,
    "emails_sent" INTEGER DEFAULT 0,
    "duration_ms" INTEGER,
    "error" TEXT,
    "track_id" VARCHAR(500),
    "track_title" VARCHAR(500),

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" VARCHAR(255) NOT NULL,
    "object" VARCHAR(50) NOT NULL DEFAULT 'invoice',
    "customer_id" INTEGER NOT NULL,
    "subscription_id" VARCHAR(255),
    "amount_due" INTEGER NOT NULL,
    "amount_paid" INTEGER DEFAULT 0,
    "amount_remaining" INTEGER DEFAULT 0,
    "subtotal" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "tax" INTEGER DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'eur',
    "status" VARCHAR(50) DEFAULT 'draft',
    "billing_reason" VARCHAR(50),
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" TIMESTAMP(6),
    "period_end" TIMESTAMP(6),
    "due_date" TIMESTAMP(6),
    "paid" BOOLEAN DEFAULT false,
    "paid_at" TIMESTAMP(6),
    "payment_intent_id" VARCHAR(255),
    "metadata" JSONB DEFAULT '{}',
    "description" TEXT,
    "invoice_pdf" VARCHAR(500),
    "hosted_invoice_url" VARCHAR(500),
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "payment_method" VARCHAR(50),
    "payment_reference" VARCHAR(255),
    "payment_notes" TEXT,
    "manually_created" BOOLEAN DEFAULT false,
    "created_by_user_id" INTEGER,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state_token" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "submission_id" UUID NOT NULL,
    "gate_id" UUID NOT NULL,
    "code_verifier" VARCHAR(255),
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" VARCHAR(255) NOT NULL,
    "object" VARCHAR(50) NOT NULL DEFAULT 'price',
    "product_id" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'eur',
    "unit_amount" INTEGER NOT NULL,
    "unit_amount_decimal" VARCHAR(50),
    "type" VARCHAR(20) NOT NULL DEFAULT 'recurring',
    "billing_scheme" VARCHAR(20) DEFAULT 'per_unit',
    "recurring_interval" VARCHAR(10),
    "recurring_interval_count" INTEGER DEFAULT 1,
    "recurring_usage_type" VARCHAR(20) DEFAULT 'licensed',
    "metadata" JSONB DEFAULT '{}',
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "livemode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" SERIAL NOT NULL,
    "plan_name" VARCHAR(50) NOT NULL,
    "max_contacts" INTEGER NOT NULL,
    "max_monthly_emails" INTEGER,
    "price_monthly_eur" DECIMAL(10,2) NOT NULL,
    "features" JSONB DEFAULT '[]',
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" VARCHAR(255) NOT NULL,
    "object" VARCHAR(50) NOT NULL DEFAULT 'product',
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "marketing_features" JSONB DEFAULT '[]',
    "metadata" JSONB DEFAULT '{}',
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "livemode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soundcloud_tracks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "track_id" VARCHAR(500) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "published_at" TIMESTAMP(6) NOT NULL,
    "cover_image" VARCHAR(1000),
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soundcloud_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spotify_tracks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "track_id" VARCHAR(500) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "published_at" TIMESTAMP(6) NOT NULL,
    "cover_image" VARCHAR(1000),
    "description" TEXT,
    "album_type" VARCHAR(50),
    "total_tracks" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spotify_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "old_plan" VARCHAR(50),
    "new_plan" VARCHAR(50),
    "old_quota" JSONB,
    "new_quota" JSONB,
    "changed_by_user_id" INTEGER,
    "change_reason" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_items" (
    "id" VARCHAR(255) NOT NULL,
    "object" VARCHAR(50) NOT NULL DEFAULT 'subscription_item',
    "subscription_id" VARCHAR(255) NOT NULL,
    "price_id" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" VARCHAR(255) NOT NULL,
    "object" VARCHAR(50) NOT NULL DEFAULT 'subscription',
    "customer_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMP(6) NOT NULL,
    "current_period_end" TIMESTAMP(6) NOT NULL,
    "billing_cycle_anchor" TIMESTAMP(6) NOT NULL,
    "cancel_at_period_end" BOOLEAN DEFAULT false,
    "cancel_at" TIMESTAMP(6),
    "canceled_at" TIMESTAMP(6),
    "ended_at" TIMESTAMP(6),
    "trial_start" TIMESTAMP(6),
    "trial_end" TIMESTAMP(6),
    "created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(6) NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "collection_method" VARCHAR(20) DEFAULT 'charge_automatically',
    "livemode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "role" VARCHAR(20) NOT NULL DEFAULT 'artist',
    "soundcloud_id" VARCHAR(255),
    "spotify_id" VARCHAR(255),
    "subscription_plan" VARCHAR(20) NOT NULL DEFAULT 'free',
    "monthly_quota" INTEGER NOT NULL DEFAULT 1000,
    "emails_sent_this_month" INTEGER NOT NULL DEFAULT 0,
    "quota_reset_at" TIMESTAMP(6) DEFAULT (date_trunc('month'::text, CURRENT_TIMESTAMP) + '1 mon'::interval),
    "active" BOOLEAN DEFAULT true,
    "email_verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(6),
    "stripe_customer_id" VARCHAR(255),
    "stripe_subscription_id" VARCHAR(255),
    "subscription_status" VARCHAR(50),
    "current_period_end" TIMESTAMP(6),
    "cancel_at_period_end" BOOLEAN DEFAULT false,
    "subscription_expires_at" TIMESTAMP(6),
    "max_contacts" INTEGER DEFAULT 100,
    "max_monthly_emails" INTEGER DEFAULT 500,
    "soundcloud_permalink" VARCHAR(255),
    "subscription_started_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_brevo_import_history_integration_id" ON "brevo_import_history"("integration_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "idx_brevo_import_history_user_id" ON "brevo_import_history"("user_id", "started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_brevo" ON "brevo_integrations"("user_id");

-- CreateIndex
CREATE INDEX "idx_brevo_integrations_user_id" ON "brevo_integrations"("user_id");

-- CreateIndex
CREATE INDEX "idx_consent_history_action" ON "consent_history"("action");

-- CreateIndex
CREATE INDEX "idx_consent_history_contact_id" ON "consent_history"("contact_id");

-- CreateIndex
CREATE INDEX "idx_consent_history_source" ON "consent_history"("source");

-- CreateIndex
CREATE INDEX "idx_consent_history_timestamp" ON "consent_history"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_consent_history_user_id" ON "consent_history"("user_id");

-- CreateIndex
CREATE INDEX "idx_contact_import_history_user_id" ON "contact_import_history"("user_id", "started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_unsubscribe_token_key" ON "contacts"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "idx_contacts_email" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "idx_contacts_source" ON "contacts"("source");

-- CreateIndex
CREATE INDEX "idx_contacts_subscribed" ON "contacts"("subscribed");

-- CreateIndex
CREATE INDEX "idx_contacts_unsubscribe_token" ON "contacts"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "idx_contacts_user_id" ON "contacts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_user_id_email_key" ON "contacts"("user_id", "email");

-- CreateIndex
CREATE INDEX "idx_download_gate_analytics_created_at" ON "download_gate_analytics"("created_at");

-- CreateIndex
CREATE INDEX "idx_download_gate_analytics_event_type" ON "download_gate_analytics"("event_type");

-- CreateIndex
CREATE INDEX "idx_download_gate_analytics_gate_id" ON "download_gate_analytics"("gate_id");

-- CreateIndex
CREATE INDEX "idx_download_gate_analytics_session_id" ON "download_gate_analytics"("session_id");

-- CreateIndex
CREATE INDEX "idx_download_gate_analytics_submission_id" ON "download_gate_analytics"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "download_gates_slug_key" ON "download_gates"("slug");

-- CreateIndex
CREATE INDEX "idx_download_gates_active" ON "download_gates"("active");

-- CreateIndex
CREATE INDEX "idx_download_gates_slug" ON "download_gates"("slug");

-- CreateIndex
CREATE INDEX "idx_download_gates_soundcloud_track_id" ON "download_gates"("soundcloud_track_id");

-- CreateIndex
CREATE INDEX "idx_download_gates_user_id" ON "download_gates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "download_submissions_download_token_key" ON "download_submissions"("download_token");

-- CreateIndex
CREATE INDEX "idx_download_submissions_created_at" ON "download_submissions"("created_at");

-- CreateIndex
CREATE INDEX "idx_download_submissions_download_token" ON "download_submissions"("download_token");

-- CreateIndex
CREATE INDEX "idx_download_submissions_email" ON "download_submissions"("email");

-- CreateIndex
CREATE INDEX "idx_download_submissions_gate_id" ON "download_submissions"("gate_id");

-- CreateIndex
CREATE INDEX "idx_download_submissions_soundcloud_user_id" ON "download_submissions"("soundcloud_user_id");

-- CreateIndex
CREATE INDEX "idx_email_campaigns_status" ON "email_campaigns"("status");

-- CreateIndex
CREATE INDEX "idx_email_campaigns_user_id" ON "email_campaigns"("user_id");

-- CreateIndex
CREATE INDEX "idx_email_events_created_at" ON "email_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_email_events_email_log_id" ON "email_events"("email_log_id");

-- CreateIndex
CREATE INDEX "idx_email_events_type" ON "email_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_email_events_user_id" ON "email_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_email_logs_campaign_id" ON "email_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_email_logs_contact_id" ON "email_logs"("contact_id");

-- CreateIndex
CREATE INDEX "idx_email_logs_sent_at" ON "email_logs"("sent_at" DESC);

-- CreateIndex
CREATE INDEX "idx_email_logs_track_id" ON "email_logs"("track_id");

-- CreateIndex
CREATE INDEX "idx_email_logs_user_id" ON "email_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_email_templates_created" ON "email_templates"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_email_templates_user_id" ON "email_templates"("user_id");

-- CreateIndex
CREATE INDEX "idx_events_created" ON "events"("created");

-- CreateIndex
CREATE INDEX "idx_events_data_object_id" ON "events"("data_object_id");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "events"("type");

-- CreateIndex
CREATE INDEX "idx_execution_logs_executed_at" ON "execution_logs"("executed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_execution_logs_user_id" ON "execution_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_invoices_created" ON "invoices"("created");

-- CreateIndex
CREATE INDEX "idx_invoices_created_by_user" ON "invoices"("created_by_user_id");

-- CreateIndex
CREATE INDEX "idx_invoices_customer" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "idx_invoices_manually_created" ON "invoices"("manually_created");

-- CreateIndex
CREATE INDEX "idx_invoices_payment_method" ON "invoices"("payment_method");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_invoices_subscription" ON "invoices"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_states_state_token_key" ON "oauth_states"("state_token");

-- CreateIndex
CREATE INDEX "idx_oauth_states_expires_at" ON "oauth_states"("expires_at");

-- CreateIndex
CREATE INDEX "idx_oauth_states_state_token" ON "oauth_states"("state_token");

-- CreateIndex
CREATE INDEX "idx_oauth_states_submission_id" ON "oauth_states"("submission_id");

-- CreateIndex
CREATE INDEX "idx_prices_active" ON "prices"("active");

-- CreateIndex
CREATE INDEX "idx_prices_product" ON "prices"("product_id");

-- CreateIndex
CREATE INDEX "idx_prices_recurring_interval" ON "prices"("recurring_interval");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_plan_name_key" ON "pricing_plans"("plan_name");

-- CreateIndex
CREATE INDEX "idx_pricing_plans_active" ON "pricing_plans"("active");

-- CreateIndex
CREATE INDEX "idx_products_active" ON "products"("active");

-- CreateIndex
CREATE INDEX "idx_products_name" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "idx_sessions_expires" ON "sessions"("expires");

-- CreateIndex
CREATE INDEX "idx_sessions_token" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_published_at" ON "soundcloud_tracks"("published_at" DESC);

-- CreateIndex
CREATE INDEX "idx_soundcloud_tracks_track_id" ON "soundcloud_tracks"("track_id");

-- CreateIndex
CREATE INDEX "idx_soundcloud_tracks_user_id" ON "soundcloud_tracks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "soundcloud_tracks_user_id_track_id_key" ON "soundcloud_tracks"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "idx_spotify_tracks_published_at" ON "spotify_tracks"("published_at" DESC);

-- CreateIndex
CREATE INDEX "idx_spotify_tracks_track_id" ON "spotify_tracks"("track_id");

-- CreateIndex
CREATE INDEX "idx_spotify_tracks_user_id" ON "spotify_tracks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_tracks_user_id_track_id_key" ON "spotify_tracks"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "idx_subscription_history_change_type" ON "subscription_history"("change_type");

-- CreateIndex
CREATE INDEX "idx_subscription_history_created_at" ON "subscription_history"("created_at");

-- CreateIndex
CREATE INDEX "idx_subscription_history_user_id" ON "subscription_history"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscription_items_price" ON "subscription_items"("price_id");

-- CreateIndex
CREATE INDEX "idx_subscription_items_subscription" ON "subscription_items"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_current_period_end" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "idx_subscriptions_customer" ON "subscriptions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "users"("active");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_soundcloud_id" ON "users"("soundcloud_id");

-- CreateIndex
CREATE INDEX "idx_users_spotify_id" ON "users"("spotify_id");

-- CreateIndex
CREATE INDEX "idx_users_subscription_expires_at" ON "users"("subscription_expires_at");

-- CreateIndex
CREATE INDEX "idx_users_subscription_plan" ON "users"("subscription_plan");

-- AddForeignKey
ALTER TABLE "brevo_import_history" ADD CONSTRAINT "brevo_import_history_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "brevo_integrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brevo_import_history" ADD CONSTRAINT "brevo_import_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brevo_integrations" ADD CONSTRAINT "brevo_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consent_history" ADD CONSTRAINT "consent_history_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consent_history" ADD CONSTRAINT "consent_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact_import_history" ADD CONSTRAINT "contact_import_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "download_gate_analytics" ADD CONSTRAINT "download_gate_analytics_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "download_gates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "download_gate_analytics" ADD CONSTRAINT "download_gate_analytics_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "download_submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "download_gates" ADD CONSTRAINT "download_gates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "download_submissions" ADD CONSTRAINT "download_submissions_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "download_gates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "download_gates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "download_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "soundcloud_tracks" ADD CONSTRAINT "soundcloud_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "spotify_tracks" ADD CONSTRAINT "spotify_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "prices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

