import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | The Backstage',
  description: 'Terms of Service for The Backstage music platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: January 9, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p>
              Welcome to The Backstage ("we," "our," "us"). These Terms of Service ("Terms") govern your access to and use of The Backstage platform, including our website at thebackstage.app ("Service"). By accessing or using our Service, you agree to be bound by these Terms.
            </p>
            <p>
              If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Definitions</h2>
            <ul>
              <li><strong>Service</strong>: The Backstage platform, including website, email notification system, and related services</li>
              <li><strong>User</strong>: Any person who accesses or uses the Service</li>
              <li><strong>Artist</strong>: A User who publishes music content and sends email notifications to Fans</li>
              <li><strong>Fan</strong>: A User who subscribes to receive email notifications from Artists</li>
              <li><strong>Content</strong>: Music tracks, artwork, text, and other materials uploaded to the Service</li>
              <li><strong>Subscriber</strong>: A Fan who has opted-in to receive email notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Account Registration and Access</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.1 Eligibility</h3>
            <p>
              You must be at least 13 years old to use the Service. If you are under 18, you must have permission from your parent or legal guardian.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.2 Account Creation</h3>
            <p>
              To access certain features, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.3 Account Restrictions</h3>
            <p>
              You may not:
            </p>
            <ul>
              <li>Share your account with others</li>
              <li>Transfer your account to another person</li>
              <li>Create multiple accounts to circumvent restrictions</li>
              <li>Use another person's account without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Services Provided</h2>
            <p>
              The Backstage provides a platform for:
            </p>
            <ul>
              <li>Artists to publish music content and connect with fans</li>
              <li>Fans to subscribe to email notifications from their favorite artists</li>
              <li>Email notification delivery when artists publish new content</li>
              <li>Subscription and consent management</li>
              <li>Email analytics (opens, clicks) with subscriber consent</li>
            </ul>
            <p>
              We strive to provide reliable service but do not guarantee uninterrupted or error-free operation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Subscription Plans and Payment</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.1 Subscription Tiers</h3>
            <p>
              We offer the following subscription plans:
            </p>
            <ul>
              <li><strong>Free</strong>: Limited features for testing</li>
              <li><strong>Pro</strong>: Enhanced features for growing artists</li>
              <li><strong>Business</strong>: Advanced features for established artists</li>
              <li><strong>Unlimited</strong>: Maximum capacity and features</li>
            </ul>
            <p>
              Current pricing and features are available at <a href="/pricing" className="text-primary hover:underline">/pricing</a>.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.2 Billing</h3>
            <ul>
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>Payment is processed automatically via our payment processor</li>
              <li>You authorize us to charge your payment method on each billing cycle</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.3 Refund Policy</h3>
            <p>
              We offer refunds under the following conditions:
            </p>
            <ul>
              <li>Within 14 days of initial subscription purchase</li>
              <li>Service outages exceeding 24 consecutive hours</li>
              <li>Material breach of these Terms by us</li>
            </ul>
            <p>
              Refunds are issued to the original payment method within 10 business days.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.4 Price Changes</h3>
            <p>
              We may change subscription prices with 30 days' notice. Existing subscribers will be notified via email and may cancel before the new price takes effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. User Obligations</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">6.1 Acceptable Use</h3>
            <p>
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You may not:
            </p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Transmit harmful code (viruses, malware, etc.)</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with the Service's operation</li>
              <li>Attempt to gain unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">6.2 Content Restrictions</h3>
            <p>
              You may not upload or transmit Content that:
            </p>
            <ul>
              <li>Is illegal, defamatory, or obscene</li>
              <li>Infringes copyright, trademark, or other rights</li>
              <li>Contains hate speech or promotes violence</li>
              <li>Is spam or unsolicited commercial content</li>
              <li>Contains personal information of others without consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Email Marketing Compliance</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.1 CAN-SPAM Act Compliance (US)</h3>
            <p>
              Artists using our email notification system must comply with the CAN-SPAM Act:
            </p>
            <ul>
              <li>Obtain valid consent before sending emails</li>
              <li>Use accurate "From" and subject line information</li>
              <li>Include a valid physical postal address</li>
              <li>Provide a clear unsubscribe mechanism</li>
              <li>Honor unsubscribe requests within 10 business days</li>
              <li>Do not send emails to addresses that have unsubscribed</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.2 GDPR Compliance (EU)</h3>
            <p>
              Artists must comply with the General Data Protection Regulation (GDPR):
            </p>
            <ul>
              <li>Obtain explicit opt-in consent (no pre-checked boxes)</li>
              <li>Provide clear information about data collection and use</li>
              <li>Allow easy consent revocation (unsubscribe)</li>
              <li>Process unsubscribe requests immediately</li>
              <li>Maintain records of consent with timestamps</li>
              <li>Report data breaches within 72 hours</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.3 Anti-Spam Policy</h3>
            <p>
              We have zero tolerance for spam. You may not:
            </p>
            <ul>
              <li>Purchase, rent, or scrape email lists</li>
              <li>Send emails without valid consent</li>
              <li>Use misleading subject lines or header information</li>
              <li>Send excessive emails (beyond reasonable frequency)</li>
              <li>Re-subscribe users who have unsubscribed</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.4 Consent Documentation</h3>
            <p>
              Our platform automatically logs:
            </p>
            <ul>
              <li>Timestamp of consent</li>
              <li>IP address</li>
              <li>User agent (browser/device)</li>
              <li>Consent source</li>
              <li>Method of consent</li>
            </ul>
            <p>
              These records are maintained for legal compliance (GDPR Article 7).
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">7.5 Consequences of Violations</h3>
            <p>
              Violation of email marketing laws may result in:
            </p>
            <ul>
              <li>Immediate account suspension</li>
              <li>Permanent account termination</li>
              <li>Reporting to authorities</li>
              <li>Legal action</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">8.1 Our Intellectual Property</h3>
            <p>
              The Service, including its code, design, logos, and trademarks, is owned by The Backstage and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute our intellectual property without permission.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">8.2 Your Content</h3>
            <p>
              You retain ownership of all Content you upload to the Service. By uploading Content, you grant us a limited license to:
            </p>
            <ul>
              <li>Store and host your Content</li>
              <li>Display your Content to your Subscribers</li>
              <li>Distribute your Content via email notifications</li>
              <li>Create thumbnails and previews</li>
              <li>Back up your Content for service reliability</li>
            </ul>
            <p>
              This license ends when you delete your Content or terminate your account.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">8.3 Content Representations</h3>
            <p>
              By uploading Content, you represent and warrant that:
            </p>
            <ul>
              <li>You own the Content or have the necessary rights</li>
              <li>Your Content does not infringe on third-party rights</li>
              <li>You have obtained all necessary licenses and permissions</li>
              <li>Your Content complies with these Terms</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">8.4 DMCA Copyright Policy</h3>
            <p>
              We respect copyright law and respond to valid DMCA takedown notices. If you believe your copyright has been infringed, contact us at:
            </p>
            <p className="ml-4">
              <strong>DMCA Agent</strong><br />
              The Backstage<br />
              Email: dmca@thebackstage.app
            </p>
            <p>
              Include: (1) identification of copyrighted work, (2) identification of infringing material, (3) contact information, (4) good faith statement, (5) accuracy statement, (6) signature.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Data and Privacy</h2>
            <p>
              Your privacy is important to us. Our collection, use, and protection of your personal data is governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference.
            </p>
            <p>
              Key points:
            </p>
            <ul>
              <li>You own your data (email lists, subscriber information)</li>
              <li>We process data in accordance with GDPR and applicable laws</li>
              <li>We log consent changes for legal compliance</li>
              <li>We implement industry-standard security measures</li>
              <li>You can export or delete your data at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitations of Liability</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.1 Service Availability</h3>
            <p>
              We strive to provide 99.9% uptime but do not guarantee uninterrupted service. We are not liable for damages resulting from service interruptions, including missed email sends, lost subscriber data, or business interruptions.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.2 Email Deliverability</h3>
            <p>
              We cannot guarantee that emails sent through our platform will be delivered to recipients' inboxes. Email deliverability depends on factors beyond our control, including recipient email providers, spam filters, and sender reputation. You are solely responsible for maintaining good sending practices.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.3 Third-Party Services</h3>
            <p>
              Our Service may integrate with third-party services (email providers, payment processors). We are not responsible for the availability, accuracy, or content of such third-party services. Your use of third-party services is governed by their respective terms of service.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.4 User Content</h3>
            <p>
              We are not responsible for user-generated Content posted on our platform. Users are solely responsible for ensuring their Content complies with applicable laws, including copyright, trademark, and privacy laws. We reserve the right to remove Content that violates these Terms without notice.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.5 Data Loss</h3>
            <p>
              While we implement industry-standard security measures and regular backups, we cannot guarantee against data loss. You are responsible for maintaining your own backups of critical data.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.6 Exclusion of Consequential Damages</h3>
            <p className="uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul>
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Unauthorized access, use, or alteration of your content</li>
              <li>Any other matter relating to the Service</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">10.7 Liability Cap</h3>
            <p>
              Our total liability to you for any claims arising from or related to this Agreement or the Service shall not exceed the greater of (a) $100 or (b) the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Warranties and Disclaimers</h2>
            <p className="uppercase font-semibold mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that:
            </p>
            <ul>
              <li>The Service will meet your requirements</li>
              <li>The Service will be uninterrupted, timely, secure, or error-free</li>
              <li>Results obtained from using the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless The Backstage, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any law or third-party rights</li>
              <li>Your email marketing activities conducted through our platform</li>
              <li>Your Content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Termination</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">13.1 Your Termination Rights</h3>
            <p>
              You may terminate your account at any time by:
            </p>
            <ul>
              <li>Using the account deletion feature in settings</li>
              <li>Contacting us at support@thebackstage.app</li>
            </ul>
            <p>
              Upon termination, your subscription will be canceled (no refunds for partial months unless required by law).
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">13.2 Our Termination Rights</h3>
            <p>
              We may suspend or terminate your account immediately if:
            </p>
            <ul>
              <li>You violate these Terms</li>
              <li>You engage in spam or email marketing violations</li>
              <li>Payment fails and remains unpaid</li>
              <li>We are required to do so by law</li>
              <li>Continuing service would cause us legal liability or disrupt the Service</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">13.3 Effect of Termination</h3>
            <p>
              Upon termination:
            </p>
            <ul>
              <li>Your access to the Service ends immediately</li>
              <li>Your Content may be deleted (we retain anonymized audit logs for legal compliance)</li>
              <li>Subscriber data is anonymized per GDPR requirements</li>
              <li>Outstanding payments remain due</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">13.4 Survival</h3>
            <p>
              The following sections survive termination: Intellectual Property, Limitations of Liability, Warranties and Disclaimers, Indemnification, Dispute Resolution, and General Provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">14.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of Spain, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">14.2 Informal Resolution</h3>
            <p>
              Before filing a legal claim, you agree to contact us at legal@thebackstage.app and attempt to resolve the dispute informally.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">14.3 Jurisdiction</h3>
            <p>
              Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Spain.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will:
            </p>
            <ul>
              <li>Update the "Last Updated" date at the top of this page</li>
              <li>Notify you via email (to the address on your account)</li>
              <li>Provide at least 30 days' notice before changes take effect</li>
            </ul>
            <p>
              Your continued use of the Service after changes take effect constitutes acceptance of the new Terms. If you do not agree to the changes, you must stop using the Service and may cancel your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. General Provisions</h2>

            <h3 className="text-xl font-semibold text-foreground mb-2">16.1 Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">16.2 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and The Backstage regarding the Service.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">16.3 Force Majeure</h3>
            <p>
              We are not liable for delays or failures in performance resulting from causes beyond our reasonable control, including natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">16.4 Assignment</h3>
            <p>
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">16.5 Waiver</h3>
            <p>
              Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or our right to enforce it later.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">17. Contact Information</h2>
            <p>
              If you have questions about these Terms, please contact us:
            </p>
            <p className="ml-4">
              <strong>The Backstage</strong><br />
              Email: legal@thebackstage.app<br />
              Support: support@thebackstage.app<br />
              Website: thebackstage.app
            </p>
          </section>

          <hr className="my-8 border-border" />

          <p className="text-sm text-muted-foreground text-center">
            By using The Backstage, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </article>
      </div>
    </div>
  );
}
