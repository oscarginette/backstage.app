import { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import { UserAppearance } from '@/domain/entities/UserAppearance';
import { Theme, THEMES } from '@/domain/types/appearance';

export interface UpdateUserAppearanceInput {
  userId: number;
  theme: Theme;
}

export interface UpdateUserAppearanceResult {
  success: boolean;
  appearance: UserAppearance;
}

/**
 * UpdateUserAppearanceUseCase
 *
 * Updates user's theme preference with validation.
 * Persists to database for cross-device sync.
 *
 * Business Rules:
 * - Theme must be valid (light, dark, system)
 * - User must exist (validated by caller/middleware)
 * - Automatically creates record if not exists (upsert)
 *
 * Clean Architecture:
 * - Use Case orchestrates business logic
 * - Depends on repository interface (DIP)
 * - Single responsibility (SRP)
 * - Easy to test (mock repository)
 *
 * USAGE:
 * ```typescript
 * const useCase = new UpdateUserAppearanceUseCase(appearanceRepository);
 * const result = await useCase.execute({
 *   userId: 123,
 *   theme: THEMES.DARK
 * });
 * console.log(result.success); // true
 * ```
 */
export class UpdateUserAppearanceUseCase {
  constructor(
    private readonly appearanceRepository: IUserAppearanceRepository
  ) {}

  /**
   * Execute use case
   *
   * @param input - Update input (userId, theme)
   * @returns Result with success flag and updated appearance
   * @throws Error if validation fails
   */
  async execute(
    input: UpdateUserAppearanceInput
  ): Promise<UpdateUserAppearanceResult> {
    this.validateInput(input);

    const updatedAppearance = await this.appearanceRepository.updateTheme(
      input.userId,
      input.theme
    );

    return {
      success: true,
      appearance: updatedAppearance,
    };
  }

  /**
   * Validate input
   * Business rules: valid userId and theme
   */
  private validateInput(input: UpdateUserAppearanceInput): void {
    // Validate userId
    if (!Number.isInteger(input.userId) || input.userId <= 0) {
      throw new Error('Invalid userId: must be positive integer');
    }

    // Validate theme
    const validThemes = Object.values(THEMES);
    if (!validThemes.includes(input.theme)) {
      throw new Error(
        `Invalid theme: ${input.theme}. Must be one of: ${validThemes.join(', ')}`
      );
    }
  }
}
