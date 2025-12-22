/**
 * UpdateUserQuotaUseCase
 *
 * Admin use case to update a user's monthly quota limit.
 * SECURITY: Must be called only by authenticated admin users.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility, Dependency Inversion.
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IQuotaTrackingRepository } from '@/domain/repositories/IQuotaTrackingRepository';
import { UnauthorizedError } from './GetAllUsersUseCase';

export interface UpdateUserQuotaInput {
  adminUserId: number;
  targetUserId: number;
  newMonthlyLimit: number;
}

export interface UpdateUserQuotaResult {
  success: boolean;
  userId: number;
  newMonthlyLimit: number;
}

export class UpdateUserQuotaUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly quotaRepository: IQuotaTrackingRepository
  ) {}

  async execute(input: UpdateUserQuotaInput): Promise<UpdateUserQuotaResult> {
    // Validate input
    this.validateInput(input);

    // Verify admin user
    const adminUser = await this.userRepository.findById(input.adminUserId);

    if (!adminUser) {
      throw new UnauthorizedError('Admin user not found');
    }

    if (!adminUser.isAdmin()) {
      throw new UnauthorizedError('Admin access required');
    }

    // Verify target user exists
    const targetUser = await this.userRepository.findById(input.targetUserId);

    if (!targetUser) {
      throw new Error(`User ${input.targetUserId} not found`);
    }

    // Update quota
    await this.quotaRepository.updateMonthlyLimit(
      input.targetUserId,
      input.newMonthlyLimit
    );

    return {
      success: true,
      userId: input.targetUserId,
      newMonthlyLimit: input.newMonthlyLimit,
    };
  }

  private validateInput(input: UpdateUserQuotaInput): void {
    if (!input.adminUserId || input.adminUserId <= 0) {
      throw new Error('Invalid adminUserId');
    }

    if (!input.targetUserId || input.targetUserId <= 0) {
      throw new Error('Invalid targetUserId');
    }

    if (
      !input.newMonthlyLimit ||
      input.newMonthlyLimit <= 0 ||
      input.newMonthlyLimit > 10000
    ) {
      throw new Error('Monthly limit must be between 1 and 10,000');
    }
  }
}
