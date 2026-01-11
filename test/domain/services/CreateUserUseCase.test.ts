/**
 * CreateUserUseCase Tests
 *
 * Tests for user registration use case covering:
 * - Successful user creation
 * - Input validation
 * - Duplicate email handling
 * - Password confirmation matching
 * - Quota tracking creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateUserUseCase } from '@/domain/services/CreateUserUseCase';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IQuotaTrackingRepository } from '@/domain/repositories/IQuotaTrackingRepository';
import { QuotaTracking } from '@/domain/entities/QuotaTracking';
import { User } from '@/domain/entities/User';

// Mock implementations
class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async create(data: any): Promise<User> {
    const user = await User.createNew(data.email, 'password', 'artist');
    this.users.set(data.email.toLowerCase(), user);
    return User.fromDatabase(
      this.users.size,
      data.email,
      data.passwordHash,
      'artist',
      true,
      new Date(),
      new Date(),
      'free',
      1000,
      0,
      new Date()
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.get(email.toLowerCase()) || null;
  }

  async findById(id: number): Promise<User | null> {
    return null;
  }

  async emailExists(email: string): Promise<boolean> {
    return this.users.has(email.toLowerCase());
  }

  async updateLastSession(userId: number): Promise<void> {}

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateActiveStatus(userId: number, active: boolean): Promise<void> {}

  async updateSubscription(userId: number, input: any): Promise<void> {}

  async incrementEmailsSent(userId: number, count: number): Promise<void> {}

  async getQuotaInfo(userId: number): Promise<{
    maxContacts: number;
    maxMonthlyEmails: number;
    emailsSentThisMonth: number;
    subscriptionPlan: string;
    subscriptionExpiresAt: Date | null;
  }> {
    return {
      maxContacts: 1000,
      maxMonthlyEmails: 1000,
      emailsSentThisMonth: 0,
      subscriptionPlan: 'free',
      subscriptionExpiresAt: null,
    };
  }

  async updateQuota(userId: number, monthlyQuota: number): Promise<void> {}

  async updateRole(email: string, role: any): Promise<User> {
    const user = this.users.get(email.toLowerCase());
    if (!user) throw new Error('User not found');
    return user;
  }

  async findAdminsByIds(ids: number[]): Promise<User[]> {
    return [];
  }

  async deleteBulk(ids: number[]): Promise<number> {
    return ids.length;
  }

  async findUsersWithSpotifyConfigured(): Promise<User[]> {
    return [];
  }

  async findUsersWithSoundCloudConfigured(): Promise<User[]> {
    return [];
  }
}

class MockQuotaTrackingRepository implements IQuotaTrackingRepository {
  private quotas: Map<number, QuotaTracking> = new Map();

  async create(userId: number, monthlyLimit: number): Promise<QuotaTracking> {
    const quota = QuotaTracking.createNew(userId, monthlyLimit);
    this.quotas.set(userId, quota);
    return quota;
  }

  async getByUserId(userId: number): Promise<QuotaTracking | null> {
    return this.quotas.get(userId) || null;
  }

  async getByUserIdWithLock(userId: number, tx: any): Promise<QuotaTracking | null> {
    return this.quotas.get(userId) || null;
  }

  async incrementEmailCount(userId: number): Promise<void> {
    // Mock implementation - no-op for tests
  }

  async incrementEmailCountInTransaction(userId: number, tx: any): Promise<void> {
    // Mock implementation - no-op for tests
  }

  async resetDailyCount(userId: number): Promise<void> {
    // Mock implementation - no-op for tests
  }

  async resetDailyCountInTransaction(userId: number, tx: any): Promise<void> {
    // Mock implementation - no-op for tests
  }

  async updateMonthlyLimit(userId: number, newLimit: number): Promise<void> {
    // Mock implementation - no-op for tests
  }

  getQuotaCreated(userId: number): boolean {
    return this.quotas.has(userId);
  }
}

describe('CreateUserUseCase', () => {
  let userRepository: MockUserRepository;
  let quotaRepository: MockQuotaTrackingRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    quotaRepository = new MockQuotaTrackingRepository();
    useCase = new CreateUserUseCase(userRepository, quotaRepository);
  });

  describe('Successful Creation', () => {
    it('should create a new user with valid data', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
        passwordConfirm: 'ValidPass123',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should normalize email to lowercase', async () => {
      const result = await useCase.execute({
        email: 'TEST@EXAMPLE.COM',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should create quota tracking for new user', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(true);
      expect(quotaRepository.getQuotaCreated(result.user!.id)).toBe(true);
    });

    it('should work without password confirmation', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(true);
    });

    it('should return user without password hash', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(true);
      expect((result.user as any)?.passwordHash).toBeUndefined();
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email format', async () => {
      const result = await useCase.execute({
        email: 'invalid-email',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject empty email', async () => {
      const result = await useCase.execute({
        email: '',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email without domain', async () => {
      const result = await useCase.execute({
        email: 'test@',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('Password Validation', () => {
    it('should reject empty password', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject password without uppercase', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'validpass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject password without lowercase', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'VALIDPASS123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject password without number', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('number');
    });

    it('should reject password shorter than 8 characters', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'Pass1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('8 characters');
    });
  });

  describe('Password Confirmation', () => {
    it('should reject mismatched passwords', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
        passwordConfirm: 'DifferentPass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Passwords do not match');
    });

    it('should accept matching passwords', async () => {
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
        passwordConfirm: 'ValidPass123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Duplicate Email Handling', () => {
    it('should reject duplicate email', async () => {
      // First registration
      await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      // Second registration with same email
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'AnotherPass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });

    it('should handle case-insensitive duplicate detection', async () => {
      await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      const result = await useCase.execute({
        email: 'TEST@EXAMPLE.COM',
        password: 'AnotherPass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });
  });

  describe('Quota Creation', () => {
    it('should continue if quota creation fails', async () => {
      // Make quota repository throw error
      const brokenQuotaRepo = {
        ...quotaRepository,
        create: vi.fn().mockRejectedValue(new Error('Database error')),
      };

      const useCaseWithBrokenQuota = new CreateUserUseCase(
        userRepository,
        brokenQuotaRepo as any
      );

      const result = await useCaseWithBrokenQuota.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      // User creation should still succeed
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    it('should create default quota of 1000 emails', async () => {
      const createSpy = vi.spyOn(quotaRepository, 'create');

      await useCase.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      expect(createSpy).toHaveBeenCalledWith(expect.any(Number), 1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const brokenUserRepo = {
        ...userRepository,
        create: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        emailExists: vi.fn().mockResolvedValue(false),
      };

      const useCaseWithError = new CreateUserUseCase(
        brokenUserRepo as any,
        quotaRepository
      );

      const result = await useCaseWithError.execute({
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });
});
