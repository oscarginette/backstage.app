/**
 * UpdateEmailSignatureUseCase
 *
 * Updates user's email signature with validation.
 */

import { IEmailSignatureRepository } from '@/domain/repositories/IEmailSignatureRepository';
import {
  EmailSignature,
  EmailSignatureData,
} from '@/domain/value-objects/EmailSignature';

export interface UpdateEmailSignatureInput {
  userId: number;
  signatureData: EmailSignatureData;
}

export class UpdateEmailSignatureUseCase {
  constructor(private signatureRepository: IEmailSignatureRepository) {}

  async execute(input: UpdateEmailSignatureInput): Promise<void> {
    // Create signature (validation happens in constructor)
    const signature = new EmailSignature(
      input.signatureData.logoUrl,
      input.signatureData.customText,
      input.signatureData.socialLinks,
      input.signatureData.defaultToGeeBeat
    );

    // Persist
    await this.signatureRepository.upsert(input.userId, signature);
  }
}
