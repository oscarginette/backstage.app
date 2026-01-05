/**
 * GetUserEmailSignatureUseCase
 *
 * Retrieves user's email signature with fallback to Gee Beat default.
 */

import { IEmailSignatureRepository } from '@/domain/repositories/IEmailSignatureRepository';
import { EmailSignature } from '@/domain/value-objects/EmailSignature';

export class GetUserEmailSignatureUseCase {
  constructor(private signatureRepository: IEmailSignatureRepository) {}

  async execute(userId: number): Promise<EmailSignature> {
    const signature = await this.signatureRepository.findByUserId(userId);

    // Fallback to Gee Beat default if no custom signature
    if (!signature) {
      return EmailSignature.createGeeBeatDefault();
    }

    return signature;
  }
}
