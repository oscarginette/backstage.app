/**
 * PasswordResetEmail Template
 *
 * Generates password reset email with magic link.
 * Professional HTML + plain text for deliverability.
 *
 * Clean Architecture: Infrastructure layer template.
 */

export interface PasswordResetEmailParams {
  resetLink: string;
  expiryHours: number;
}

export class PasswordResetEmail {
  /**
   * Generate subject line
   */
  static getSubject(): string {
    return 'Reset Your Password - The Backstage';
  }

  /**
   * Generate plain text email body
   */
  static getBody(params: PasswordResetEmailParams): string {
    return `
Reset Your Password

We received a request to reset your password for The Backstage.

Click the link below to reset your password:
${params.resetLink}

This link will expire in ${params.expiryHours} hour${params.expiryHours !== 1 ? 's' : ''}.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

For security reasons, this link can only be used once.

---
The Backstage
`.trim();
  }

  /**
   * Generate HTML email body
   */
  static getHtml(params: PasswordResetEmailParams): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #FF5500; margin-bottom: 24px; font-size: 24px;">Reset Your Password</h2>

    <p style="margin-bottom: 20px; font-size: 16px;">
      We received a request to reset your password for The Backstage.
    </p>

    <p style="margin-bottom: 30px; font-size: 16px;">
      Click the button below to reset your password:
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${params.resetLink}"
         style="display: inline-block;
                background-color: #FF5500;
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;">
        Reset Password
      </a>
    </div>

    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
      This link will expire in <strong>${params.expiryHours} hour${params.expiryHours !== 1 ? 's' : ''}</strong>.
    </p>

    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin-bottom: 12px; font-size: 14px; color: #666;">
        <strong>Didn't request a password reset?</strong>
      </p>
      <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
        You can safely ignore this email. Your password will not be changed.
      </p>
      <p style="margin-bottom: 0; font-size: 14px; color: #666;">
        For security reasons, this link can only be used once.
      </p>
    </div>

    <p style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
      The Backstage<br>
      <a href="https://thebackstage.app" style="color: #FF5500; text-decoration: none;">thebackstage.app</a>
    </p>
  </div>

  <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="${params.resetLink}" style="color: #666; word-break: break-all;">${params.resetLink}</a>
  </p>
</body>
</html>
`.trim();
  }
}
