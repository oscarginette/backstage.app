/**
 * Import geebeat.com from Mailgun to Database
 *
 * Since geebeat.com already exists in Mailgun but not in our DB,
 * this script fetches it from Mailgun and inserts it into the database.
 *
 * Usage:
 *   node scripts/import-geebeat-domain.js
 */

const FormData = require('form-data');
const Mailgun = require('mailgun.js');
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const [key, ...valueParts] = trimmed.split('=');
      let value = valueParts.join('=').trim();

      if (key && value) {
        const commentIndex = value.indexOf('#');
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim();
        }
        value = value.replace(/^["']|["']$/g, '');
        if (value) {
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.error('Could not load .env.local:', error.message);
  }
}

loadEnvLocal();

async function importGeebeatDomain() {
  console.log('📥 Importing geebeat.com from Mailgun to database...\n');

  const apiKey = process.env.MAILGUN_API_KEY;
  const apiUrl = process.env.MAILGUN_API_URL || 'https://api.mailgun.net';
  const userId = 3; // From your logs: userId: '3'

  if (!apiKey) {
    console.error('❌ MAILGUN_API_KEY not found');
    process.exit(1);
  }

  // Initialize Mailgun
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
    url: apiUrl,
  });

  try {
    // 1. Get domain info from Mailgun
    console.log('1️⃣  Fetching geebeat.com from Mailgun...');
    const domain = await mg.domains.get('geebeat.com');

    console.log('✅ Domain found in Mailgun:');
    console.log('   Name:', domain.name);
    console.log('   State:', domain.state);
    console.log('   Created:', domain.created_at);
    console.log('   Sending DNS records:', domain.sending_dns_records?.length || 0);
    console.log('   Receiving DNS records:', domain.receiving_dns_records?.length || 0);
    console.log('');

    // 2. Parse DNS records
    const sendingRecords = domain.sending_dns_records || [];
    const receivingRecords = domain.receiving_dns_records || [];

    // SPF
    const spfRecord = sendingRecords.find(
      r => r.record_type === 'TXT' && !r.name.includes('_') && r.value?.includes('v=spf1')
    );

    // DKIM
    const dkimRecord = sendingRecords.find(
      r => r.record_type === 'TXT' && r.name.includes('_domainkey')
    );

    // DMARC (might not exist yet)
    const dmarcRecord = sendingRecords.find(
      r => r.record_type === 'TXT' && r.name.includes('_dmarc')
    );

    // Tracking CNAME
    const trackingRecord = sendingRecords.find(
      r => r.record_type === 'CNAME'
    );

    // MX Records
    const mxRecords = receivingRecords
      .filter(r => r.record_type === 'MX')
      .map(r => ({
        type: 'MX',
        name: r.name || '',
        value: r.value || '',
        priority: r.priority || 10,
      }));

    const dnsRecords = {
      spf: {
        type: 'TXT',
        name: spfRecord?.name || '',
        value: spfRecord?.value || '',
      },
      dkim: {
        type: 'TXT',
        name: dkimRecord?.name || '',
        value: dkimRecord?.value || '',
      },
      dmarc: {
        type: 'TXT',
        name: dmarcRecord?.name || '_dmarc.geebeat.com',
        value: dmarcRecord?.value || 'v=DMARC1; p=none',
      },
    };

    if (trackingRecord) {
      dnsRecords.tracking = {
        type: 'CNAME',
        name: trackingRecord.name || '',
        value: trackingRecord.value || '',
      };
    }

    if (mxRecords.length > 0) {
      dnsRecords.mx = mxRecords;
    }

    console.log('2️⃣  DNS Records parsed:');
    console.log('   SPF:', dnsRecords.spf.name, '→', dnsRecords.spf.value.substring(0, 40) + '...');
    console.log('   DKIM:', dnsRecords.dkim.name);
    console.log('   DMARC:', dnsRecords.dmarc.name, '→', dnsRecords.dmarc.value);
    if (dnsRecords.tracking) {
      console.log('   Tracking:', dnsRecords.tracking.name, '→', dnsRecords.tracking.value);
    }
    console.log('   MX records:', mxRecords.length);
    console.log('');

    // 3. Insert into database
    console.log('3️⃣  Inserting into database...');

    const result = await sql`
      INSERT INTO sending_domains (
        user_id,
        domain,
        status,
        mailgun_domain_name,
        dns_records,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${domain.name},
        'dns_configured',
        ${domain.name},
        ${JSON.stringify(dnsRecords)},
        NOW(),
        NOW()
      )
      ON CONFLICT (domain) DO UPDATE
      SET
        dns_records = ${JSON.stringify(dnsRecords)},
        mailgun_domain_name = ${domain.name},
        updated_at = NOW()
      RETURNING id, domain, status
    `;

    console.log('✅ Domain inserted/updated in database:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Domain:', result.rows[0].domain);
    console.log('   Status:', result.rows[0].status);
    console.log('');

    console.log('🎉 SUCCESS! geebeat.com is now in your database');
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to /settings/sending-domains in your app');
    console.log('2. You should see geebeat.com listed');
    console.log('3. Copy the DNS records and add them to your DNS provider');
    console.log('4. Click "Verify" to check DNS configuration');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run import
importGeebeatDomain()
  .then(() => {
    console.log('✅ Import completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
