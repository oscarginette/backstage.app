/**
 * Test Password Reset Email
 *
 * Script para probar el envío de email de reset de contraseña
 *
 * Usage:
 *   npx tsx scripts/test-password-reset-email.ts
 */

import { UseCaseFactory } from '@/lib/di-container';

async function testPasswordResetEmail() {
  console.log('🧪 Testing Password Reset Email...\n');

  const email = process.argv[2] || 'reset-test@example.com'; // Cambia esto por tu email para probar
  const resetUrl = 'http://localhost:3002/reset-password';

  try {
    const useCase = UseCaseFactory.createRequestPasswordResetUseCase();

    const result = await useCase.execute({
      email,
      resetUrl,
      ipAddress: '127.0.0.1',
      userAgent: 'test-script',
    });

    console.log('\n📧 Result:', {
      success: result.success,
      message: result.message,
    });

    if (result.success) {
      console.log('\n✅ Success!');
      console.log('📮 Check your email inbox (or Resend dashboard)');
      console.log('🔗 Resend Dashboard: https://resend.com/emails');
    } else {
      console.log('\n❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('\n💥 Error:', error);
  }
}

testPasswordResetEmail();
