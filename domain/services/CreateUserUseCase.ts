/**
 * CreateUserUseCase
 *
 * Handles user registration with validation and duplicate checking.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Email must be unique (case-insensitive)
 * - Password must meet strength requirements
 * - Automatically creates quota tracking for new users
 *
 * SECURITY: Password is hashed before storage, never exposed in responses.
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IQuotaTrackingRepository } from '../repositories/IQuotaTrackingRepository';
import { User } from '../entities/User';

export interface CreateUserInput {
  email: string;
  password: string;
  passwordConfirm?: string;
}

export interface CreateUserResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    createdAt: Date;
  };
  error?: string;
}

/**
 * CreateUserUseCase
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (user creation)
 * - OCP: Open for extension (easy to add new validation rules)
 * - LSP: Works with any IUserRepository implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */
export class CreateUserUseCase {
  private readonly DEFAULT_MONTHLY_QUOTA = 1000;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly quotaRepository: IQuotaTrackingRepository
  ) {}

  /**
   * Execute user creation
   * @param input - User registration data
   * @returns CreateUserResult with user data (no password hash)
   */
  async execute(input: CreateUserInput): Promise<CreateUserResult> {
    try {
      // 1. Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 2. Check if email already exists
      const emailExists = await this.userRepository.emailExists(input.email);
      if (emailExists) {
        return {
          success: false,
          error: 'Email already registered',
        };
      }

      // 3. Create user entity (hashes password internally)
      const user = await User.createNew(input.email, input.password);

      // 4. Save to database
      const createdUser = await this.userRepository.create({
        email: user.email,
        passwordHash: user.passwordHash,
      });

      // 5. Create quota tracking for new user
      try {
        await this.quotaRepository.create(
          createdUser.id,
          this.DEFAULT_MONTHLY_QUOTA
        );
      } catch (quotaError) {
        console.error('Failed to create quota tracking:', quotaError);
        // User created successfully, but quota creation failed
        // This is non-critical - quota can be created later
      }

      // 6. Return user data (without password hash)
      return {
        success: true,
        user: createdUser.toPublic(),
      };
    } catch (error) {
      console.error('CreateUserUseCase.execute error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  /**
   * Validate user input
   * @param input - User registration data
   * @returns Error message or null if valid
   */
  private validateInput(input: CreateUserInput): string | null {
    // Validate email
    const emailValidation = User.validateEmail(input.email);
    if (!emailValidation.valid) {
      return emailValidation.error || 'Invalid email';
    }

    // Validate password
    if (!input.password) {
      return 'Password is required';
    }

    const passwordValidation = User.validatePasswordStrength(input.password);
    if (!passwordValidation.valid) {
      return passwordValidation.errors[0]; // Return first error
    }

    // Validate password confirmation (if provided)
    if (input.passwordConfirm !== undefined) {
      if (input.password !== input.passwordConfirm) {
        return 'Passwords do not match';
      }
    }

    return null;
  }
}
