require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  console.log('🗄️  Setting up database tables...\n');

  try {
    // Create soundcloud_tracks table
    console.log('Creating soundcloud_tracks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS soundcloud_tracks (
        id SERIAL PRIMARY KEY,
        track_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        url TEXT NOT NULL,
        published_at TIMESTAMP NOT NULL,
        email_sent_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ soundcloud_tracks table created');

    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_track_id ON soundcloud_tracks(track_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_published_at ON soundcloud_tracks(published_at DESC)`;
    console.log('✅ Indexes created');

    // Create execution_logs table
    console.log('Creating execution_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id SERIAL PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT NOW(),
        new_tracks INTEGER DEFAULT 0,
        emails_sent INTEGER DEFAULT 0,
        error TEXT,
        duration_ms INTEGER
      )
    `;
    console.log('✅ execution_logs table created');

    // Create app_config table
    console.log('Creating app_config table...');
    await sql`
      CREATE TABLE IF NOT EXISTS app_config (
        id INTEGER PRIMARY KEY,
        brevo_list_ids TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ app_config table created');

    // Insert default config
    console.log('Inserting default configuration (lists 2 and 3)...');
    await sql`
      INSERT INTO app_config (id, brevo_list_ids, updated_at)
      VALUES (1, '[2,3]', NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('✅ Default configuration inserted');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('soundcloud_tracks', 'execution_logs', 'app_config')
      ORDER BY table_name
    `;

    console.log('\nTables created:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Show config
    console.log('\n⚙️  Configuration:');
    const config = await sql`SELECT * FROM app_config WHERE id = 1`;
    if (config.rows.length > 0) {
      console.log(`  Lists configured: ${config.rows[0].brevo_list_ids}`);
    }

    console.log('\n🎉 Database setup completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
