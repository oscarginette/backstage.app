import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | The Backstage',
  description: 'Privacy Policy for The Backstage - GDPR Compliant',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: January 9, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p>
              The Backstage ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data when you use our music platform at thebackstage.app ("Service").
            </p>
            <p>
              This policy complies with the General Data Protection Regulation (GDPR), CAN-SPAM Act, and other applicable data protection laws.
            </p>
            <p>
              <strong>Quick Summary:</strong> We collect your email address and basic information to send you music notifications from artists you follow. We track email opens and clicks only if you consent. You can unsubscribe anytime with one click.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Data Controller Information</h2>
            <p>
              The data controller responsible for your personal data is:
            </p>
            <p className="ml-4">
              <strong>The Backstage</strong><br />
              Email: privacy@thebackstage.app<br />
              Support: support@thebackstage.app<br />
              Website: thebackstage.app
            </p>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at the above address.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. What Data We Collect</h2>
            <p>
              We collect the following categories of personal data:
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.1 Information You Provide</h3>
            <ul>
              <li><strong>Email Address</strong>: Required for account creation and email notifications</li>
              <li><strong>Name</strong>: Optional, used for personalization (e.g., "Hi John")</li>
              <li><strong>Artist/Fan Preferences</strong>: Which artists you follow, notification preferences</li>
              <li><strong>Account Credentials</strong>: Password (encrypted), authentication tokens</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.2 Automatically Collected Data</h3>
            <ul>
              <li><strong>IP Address</strong>: Collected when you sign up, unsubscribe, or interact with emails (required for GDPR consent logging)</li>
              <li><strong>User Agent</strong>: Browser and device information (required for GDPR consent logging)</li>
              <li><strong>Timestamps</strong>: When you perform actions (subscribe, unsubscribe, consent changes)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.3 Email Engagement Data (Only with Consent)</h3>
            <ul>
              <li><strong>Email Opens</strong>: Whether you opened an email (tracked via pixel)</li>
              <li><strong>Link Clicks</strong>: Which links you clicked in emails</li>
              <li><strong>Device/Client</strong>: Email client used (Gmail, Outlook, etc.)</li>
              <li><strong>Location</strong>: General geographic location (city/country level)</li>
            </ul>
            <p className="text-sm italic">
              Note: Email tracking requires separate consent (see Section 7). You can subscribe without tracking.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.4 Consent History (Legal Requirement)</h3>
            <ul>
              <li><strong>Consent Records</strong>: When you consented, how, and for what purpose</li>
              <li><strong>IP Address at Consent</strong>: Required proof of consent (GDPR Article 7)</li>
              <li><strong>User Agent at Consent</strong>: Device/browser used during consent</li>
              <li><strong>Source</strong>: Where consent was obtained (signup form, settings page)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. How We Collect Data</h2>
            <ul>
              <li><strong>Signup Forms</strong>: When you create an account or subscribe to an artist</li>
              <li><strong>Settings Pages</strong>: When you update preferences or manage subscriptions</li>
              <li><strong>Email Interactions</strong>: When you open or click links in our emails (if tracking enabled)</li>
              <li><strong>Unsubscribe Links</strong>: When you unsubscribe via email link or settings</li>
              <li><strong>APIs/Integrations</strong>: If you connect third-party services (e.g., Spotify)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Why We Use Your Data (Legal Basis)</h2>
            <p>
              Under GDPR Article 6, we process your personal data based on the following legal grounds:
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.1 Consent (GDPR Art. 6(1)(a))</h3>
            <ul>
              <li><strong>Email Notifications</strong>: We send you music updates only if you opt-in</li>
              <li><strong>Email Tracking</strong>: We track opens/clicks only with separate, explicit consent</li>
            </ul>
            <p>
              You can withdraw consent at any time by unsubscribing (emails) or disabling tracking (settings).
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.2 Contract Performance (GDPR Art. 6(1)(b))</h3>
            <ul>
              <li><strong>Account Management</strong>: Creating and maintaining your account</li>
              <li><strong>Service Delivery</strong>: Providing platform features (artist subscriptions, content access)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.3 Legal Obligation (GDPR Art. 6(1)(c))</h3>
            <ul>
              <li><strong>Consent Logging</strong>: GDPR Article 7 requires proof of consent</li>
              <li><strong>Audit Trails</strong>: Maintaining records for legal compliance and disputes</li>
              <li><strong>Tax/Accounting</strong>: Retaining payment records as required by law</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.4 Legitimate Interest (GDPR Art. 6(1)(f))</h3>
            <ul>
              <li><strong>Security</strong>: Fraud prevention, abuse detection</li>
              <li><strong>Service Improvement</strong>: Analyzing aggregated, anonymized usage data</li>
              <li><strong>Communications</strong>: Sending essential service updates (not marketing)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. How We Use Your Data</h2>
            <ul>
              <li><strong>Send Email Notifications</strong>: Deliver music updates from artists you follow</li>
              <li><strong>Personalize Content</strong>: Use your name and preferences to customize emails</li>
              <li><strong>Measure Engagement</strong>: Track opens/clicks to help artists understand their audience (with consent)</li>
              <li><strong>Improve Service</strong>: Analyze aggregated data to enhance platform features</li>
              <li><strong>Prevent Abuse</strong>: Detect spam, fraud, and Terms of Service violations</li>
              <li><strong>Legal Compliance</strong>: Maintain consent records and respond to legal requests</li>
              <li><strong>Customer Support</strong>: Respond to inquiries and resolve issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Email Tracking and Cookies</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.1 Tracking Pixels</h3>
            <p>
              We use tracking pixels (small, invisible images) in emails to measure:
            </p>
            <ul>
              <li>Whether you opened the email</li>
              <li>Which links you clicked</li>
              <li>Your email client (Gmail, Outlook, etc.)</li>
              <li>General location (city/country)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.2 Separate Consent Required</h3>
            <p>
              Per GDPR and ePrivacy Directive, email tracking requires <strong>explicit prior consent</strong>, separate from your email subscription consent.
            </p>
            <ul>
              <li>During signup, you'll see two checkboxes: (1) Receive emails, (2) Enable tracking</li>
              <li>You can subscribe without tracking</li>
              <li>You can withdraw tracking consent anytime in settings (while staying subscribed)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.3 How to Opt Out</h3>
            <ul>
              <li><strong>Disable Tracking</strong>: Go to Settings → Privacy → Disable "Email Analytics"</li>
              <li><strong>Unsubscribe Entirely</strong>: Click "Unsubscribe" in any email footer</li>
              <li><strong>Block Pixels</strong>: Use email client privacy features (Apple Mail Privacy Protection, Gmail "Always ask before displaying external images")</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.4 Cookie Policy</h3>
            <p>
              Our website uses the following cookies:
            </p>
            <ul>
              <li><strong>Essential Cookies</strong>: Session management, authentication, security (no consent required)</li>
              <li><strong>Analytics Cookies</strong>: Website usage statistics (requires consent)</li>
              <li><strong>Preference Cookies</strong>: Remember your settings (theme, language)</li>
            </ul>
            <p>
              You can manage cookie preferences in your browser settings or via our cookie consent banner.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Who We Share Data With</h2>
            <p>
              We share your personal data only with trusted service providers who help us operate the platform. We do <strong>NOT</strong> sell, rent, or share your data for marketing purposes.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">8.1 Service Providers (Data Processors)</h3>
            <p>
              We share data with the following third-party processors:
            </p>
            <ul>
              <li>
                <strong>Email Delivery</strong>: Resend (email sending infrastructure)
                <br />
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Privacy Policy</a>
              </li>
              <li>
                <strong>Web Hosting</strong>: Vercel (platform infrastructure)
                <br />
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Privacy Policy</a>
              </li>
              <li>
                <strong>Database Hosting</strong>: Neon (PostgreSQL database)
                <br />
                <a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Privacy Policy</a>
              </li>
              <li>
                <strong>Authentication</strong>: NextAuth (authentication services)
                <br />
                <a href="https://next-auth.js.org/security" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Security</a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">8.2 Data Processing Agreements (DPAs)</h3>
            <p>
              All service providers have signed Data Processing Agreements that ensure GDPR compliance and commit them to:
            </p>
            <ul>
              <li>Process data only on our instructions</li>
              <li>Implement appropriate security measures</li>
              <li>Assist with your rights requests (access, deletion, etc.)</li>
              <li>Delete data when no longer needed</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">8.3 Legal Disclosures</h3>
            <p>
              We may disclose your data if required by law:
            </p>
            <ul>
              <li>Court orders or subpoenas</li>
              <li>Government investigations</li>
              <li>Compliance with legal obligations</li>
              <li>Protection of our legal rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">9.1 Transfer Locations</h3>
            <p>
              Your data may be transferred to and processed in:
            </p>
            <ul>
              <li><strong>European Union</strong>: Primary database and hosting servers</li>
              <li><strong>United States</strong>: Some service providers (Vercel, Resend)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">9.2 Transfer Safeguards</h3>
            <p>
              For transfers outside the EU/EEA, we rely on:
            </p>
            <ul>
              <li><strong>Adequacy Decisions</strong>: EU Commission-approved countries (UK, Switzerland)</li>
              <li><strong>Standard Contractual Clauses (SCCs)</strong>: EU-approved contract templates with US processors</li>
              <li><strong>Data Privacy Framework</strong>: US organizations certified under EU-US Data Privacy Framework</li>
            </ul>
            <p>
              All transfers comply with GDPR Chapter V requirements and include appropriate safeguards to protect your data.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">9.3 Request Copy of Safeguards</h3>
            <p>
              You can request a copy of the safeguards we have in place by contacting privacy@thebackstage.app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. How Long We Keep Data</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.1 Active Subscribers</h3>
            <ul>
              <li><strong>Email Address</strong>: Until you unsubscribe or delete your account</li>
              <li><strong>Name & Preferences</strong>: Until you delete your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.2 Unsubscribed Users</h3>
            <ul>
              <li><strong>Immediate Anonymization</strong>: Email replaced with "deleted-[ID]@anonymized.local" within 30 days</li>
              <li><strong>Retention Period</strong>: Anonymized records kept for 7 years (legal defense, fraud prevention)</li>
              <li><strong>GDPR Compliance</strong>: Article 17 allows retention for "establishment, exercise or defense of legal claims"</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.3 Consent Logs (Exception)</h3>
            <ul>
              <li><strong>Retention</strong>: <strong>Indefinite</strong> or minimum 7 years</li>
              <li><strong>Legal Basis</strong>: GDPR Article 7(1) requires proof of consent</li>
              <li><strong>What's Logged</strong>: Who consented, when, how, IP address, user agent</li>
              <li><strong>Important</strong>: Even after email deletion, consent logs are retained for legal compliance</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.4 Email Engagement Data</h3>
            <ul>
              <li><strong>Opens/Clicks</strong>: Retained for 2 years (analytics purposes)</li>
              <li><strong>Automated Deletion</strong>: Data older than 2 years is automatically deleted</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.5 Security Logs</h3>
            <ul>
              <li><strong>Access Logs</strong>: Retained for 30 days (security monitoring, debugging)</li>
              <li><strong>Automated Deletion</strong>: Logs older than 30 days are automatically deleted</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.6 Backup Data</h3>
            <ul>
              <li><strong>Retention</strong>: 30 days in encrypted backups</li>
              <li><strong>Purpose</strong>: Service reliability and disaster recovery</li>
              <li><strong>Deletion</strong>: Old backups automatically deleted after 30 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Your Rights Under GDPR</h2>
            <p>
              You have the following rights regarding your personal data:
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.1 Right to Access</h3>
            <p>
              You can request a copy of all personal data we hold about you.
            </p>
            <ul>
              <li><strong>How</strong>: Email privacy@thebackstage.app or use "Export Data" in settings</li>
              <li><strong>Response Time</strong>: 30 days (may extend to 90 days if complex)</li>
              <li><strong>Format</strong>: CSV or JSON (structured, machine-readable)</li>
              <li><strong>Cost</strong>: Free (first request)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.2 Right to Rectification</h3>
            <p>
              You can correct inaccurate or incomplete data.
            </p>
            <ul>
              <li><strong>How</strong>: Update in Settings or contact privacy@thebackstage.app</li>
              <li><strong>Response Time</strong>: 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.3 Right to Erasure ("Right to Be Forgotten")</h3>
            <p>
              You can request deletion of all your personal data.
            </p>
            <ul>
              <li><strong>How</strong>: Email privacy@thebackstage.app or use "Delete Account" in settings</li>
              <li><strong>Scope</strong>: More comprehensive than unsubscribe - deletes all account data</li>
              <li><strong>Exceptions</strong>: Anonymized consent logs (legal requirement), accounting records (tax law)</li>
              <li><strong>Response Time</strong>: 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.4 Right to Restriction</h3>
            <p>
              You can request we temporarily stop processing your data (e.g., while resolving a dispute).
            </p>
            <ul>
              <li><strong>How</strong>: Contact privacy@thebackstage.app</li>
              <li><strong>Response Time</strong>: 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.5 Right to Data Portability</h3>
            <p>
              You can receive your data in a portable format and transmit it to another service.
            </p>
            <ul>
              <li><strong>How</strong>: Use "Export Data" in settings or email privacy@thebackstage.app</li>
              <li><strong>Format</strong>: CSV or JSON</li>
              <li><strong>Included</strong>: Email, name, subscription preferences, engagement history</li>
              <li><strong>Response Time</strong>: 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.6 Right to Object (Marketing)</h3>
            <p>
              You have an <strong>absolute right</strong> to object to direct marketing at any time.
            </p>
            <ul>
              <li><strong>How</strong>: Click "Unsubscribe" in any email or go to Settings</li>
              <li><strong>Response Time</strong>: <strong>Immediate</strong> (no delay allowed)</li>
              <li><strong>Effect</strong>: All marketing emails stop immediately</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.7 Right to Withdraw Consent</h3>
            <p>
              You can withdraw consent for data processing at any time.
            </p>
            <ul>
              <li><strong>Email Notifications</strong>: Click "Unsubscribe" in any email</li>
              <li><strong>Email Tracking</strong>: Disable in Settings → Privacy</li>
              <li><strong>Effect</strong>: Processing stops immediately (does not affect past processing)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.8 Right to Lodge a Complaint</h3>
            <p>
              You have the right to complain to a data protection authority.
            </p>
            <ul>
              <li><strong>Spain</strong>: Agencia Española de Protección de Datos (AEPD) - <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aepd.es</a></li>
              <li><strong>UK</strong>: Information Commissioner's Office (ICO) - <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ico.org.uk</a></li>
              <li><strong>EU</strong>: Find your authority at <a href="https://edpb.europa.eu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">edpb.europa.eu</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">11.9 How to Exercise Your Rights</h3>
            <p>
              To exercise any of these rights:
            </p>
            <ol>
              <li>Email privacy@thebackstage.app with your request</li>
              <li>Include your account email for verification</li>
              <li>We may request additional information to verify your identity (security measure)</li>
              <li>We will respond within 30 days (may extend to 90 days if complex)</li>
              <li>All requests are <strong>free of charge</strong> (unless manifestly unfounded or excessive)</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data:
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">12.1 Technical Safeguards</h3>
            <ul>
              <li><strong>Encryption in Transit</strong>: TLS/SSL for all connections (HTTPS)</li>
              <li><strong>Encryption at Rest</strong>: Database encryption for stored data</li>
              <li><strong>Password Security</strong>: Bcrypt hashing with salt</li>
              <li><strong>Secure Authentication</strong>: Multi-factor authentication available</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">12.2 Organizational Safeguards</h3>
            <ul>
              <li><strong>Access Controls</strong>: Role-based access (least privilege principle)</li>
              <li><strong>Employee Training</strong>: Regular security and privacy training</li>
              <li><strong>Vendor Audits</strong>: Annual review of service provider security</li>
              <li><strong>Incident Response</strong>: Documented breach notification process</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">12.3 Data Breach Notification</h3>
            <p>
              In the event of a data breach affecting your personal data:
            </p>
            <ul>
              <li>We will notify you within <strong>72 hours</strong> of discovery (GDPR requirement)</li>
              <li>Notification will include nature of breach, likely consequences, and mitigation measures</li>
              <li>We will also notify relevant data protection authorities</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">12.4 Your Responsibilities</h3>
            <ul>
              <li>Keep your password secure and confidential</li>
              <li>Use a strong, unique password</li>
              <li>Enable multi-factor authentication</li>
              <li>Log out after using shared devices</li>
              <li>Report suspicious activity immediately</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal data from children under 13.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal data, please contact us at privacy@thebackstage.app. We will delete such data promptly.
            </p>
            <p>
              For users in the EU, the minimum age is 16 (or lower if permitted by Member State law with parental consent).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Your Choices</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">14.1 Email Preferences</h3>
            <ul>
              <li><strong>Unsubscribe</strong>: Click "Unsubscribe" in any email footer (one-click)</li>
              <li><strong>Manage Subscriptions</strong>: Go to Settings → Subscriptions to choose which artists to follow</li>
              <li><strong>Frequency Control</strong>: Set maximum email frequency per artist</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">14.2 Tracking Preferences</h3>
            <ul>
              <li><strong>Disable Email Tracking</strong>: Settings → Privacy → Disable "Email Analytics"</li>
              <li><strong>Effect</strong>: We won't track opens/clicks (but emails still deliver)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">14.3 Account Deletion</h3>
            <ul>
              <li><strong>Delete Account</strong>: Settings → Account → Delete Account</li>
              <li><strong>Effect</strong>: All personal data deleted (except anonymized audit logs)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">14.4 Cookie Preferences</h3>
            <ul>
              <li><strong>Manage Cookies</strong>: Use cookie consent banner or browser settings</li>
              <li><strong>Block All Cookies</strong>: Browser settings (may affect functionality)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material changes:
            </p>
            <ul>
              <li>We will update the "Last Updated" date at the top</li>
              <li>We will notify you via email (to the address on your account)</li>
              <li>We will provide at least 30 days' notice before changes take effect</li>
              <li>Your continued use after changes take effect constitutes acceptance</li>
            </ul>
            <p>
              If you do not agree to the changes, you may delete your account before the effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices:
            </p>
            <p className="ml-4">
              <strong>Privacy Inquiries</strong><br />
              Email: privacy@thebackstage.app<br />
              Subject: "Privacy Inquiry - [Your Name]"<br />
              Response Time: Within 30 days
            </p>
            <p className="ml-4 mt-4">
              <strong>General Support</strong><br />
              Email: support@thebackstage.app<br />
              Website: thebackstage.app
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">17. Supervisory Authority</h2>
            <p>
              If you believe we have not adequately addressed your privacy concerns, you have the right to lodge a complaint with a supervisory authority:
            </p>
            <p className="ml-4">
              <strong>Spain (Primary Authority)</strong><br />
              Agencia Española de Protección de Datos (AEPD)<br />
              Website: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aepd.es</a><br />
              Address: C/ Jorge Juan, 6, 28001 Madrid, Spain
            </p>
            <p className="ml-4 mt-4">
              <strong>Other EU/EEA Authorities</strong><br />
              Find your local data protection authority at:<br />
              <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">European Data Protection Board - Member List</a>
            </p>
          </section>

          <hr className="my-8 border-border" />

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Summary: Your Key Privacy Rights</h2>
            <div className="bg-muted p-6 rounded-lg">
              <ul className="space-y-2">
                <li>✅ You can <strong>unsubscribe</strong> anytime with one click</li>
                <li>✅ You control <strong>email tracking</strong> (separate consent)</li>
                <li>✅ You can <strong>export your data</strong> in CSV/JSON format</li>
                <li>✅ You can <strong>delete your account</strong> completely</li>
                <li>✅ We <strong>never sell</strong> your email address</li>
                <li>✅ We keep <strong>consent logs</strong> for legal compliance (GDPR requirement)</li>
                <li>✅ We respond to rights requests within <strong>30 days</strong></li>
                <li>✅ All requests are <strong>free of charge</strong></li>
              </ul>
            </div>
          </section>

          <hr className="my-8 border-border" />

          <p className="text-sm text-muted-foreground text-center">
            By using The Backstage, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </article>
      </div>
    </div>
  );
}
