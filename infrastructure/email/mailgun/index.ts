/**
 * Mailgun Domain Client Exports
 *
 * Barrel export for Mailgun domain verification infrastructure.
 * Interface is now in domain layer (Clean Architecture).
 */

export type { IMailgunClient, MailgunDomainCreationResult, MailgunDomainVerificationResult } from '@/domain/providers/IMailgunClient';
export { MailgunDomainClient } from './MailgunDomainClient';
