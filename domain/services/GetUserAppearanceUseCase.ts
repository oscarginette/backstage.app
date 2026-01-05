import { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import { UserAppearance } from '@/domain/entities/UserAppearance';

/**
 * GetUserAppearanceUseCase
 *
 * Retrieves user's appearance preferences.
 * Returns default (system theme) if no preference stored.
 *
 * Clean Architecture:
 * - Use Case orchestrates business logic
 * - Depends on repository interface (DIP)
 * - Single responsibility (SRP)
 * - Easy to test (mock repository)
 *
 * USAGE:
 * ```typescript
 * const useCase = new GetUserAppearanceUseCase(appearanceRepository);
 * const appearance = await useCase.execute(userId);
 * console.log(appearance.theme); // 'light' | 'dark' | 'system'
 * ```
 */
export class GetUserAppearanceUseCase {
  constructor(
    private readonly appearanceRepository: IUserAppearanceRepository
  ) {}

  /**
   * Execute use case
   *
   * @param userId - User ID
   * @returns UserAppearance entity
   * @throws Error if userId is invalid
   */
  async execute(userId: number): Promise<UserAppearance> {
    this.validateUserId(userId);

    // Repository returns default if not found
    const appearance = await this.appearanceRepository.getByUserId(userId);

    return appearance;
  }

  /**
   * Validate user ID
   * Business rule: userId must be positive integer
   */
  private validateUserId(userId: number): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid userId: must be positive integer');
    }
  }
}
