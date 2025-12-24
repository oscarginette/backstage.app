/**
 * User Entity Tests
 *
 * Tests for the User domain entity covering:
 * - Password hashing and verification
 * - Email validation
 * - Password strength validation
 * - Entity creation from database
 * - Business logic methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { User, UserRole } from '@/domain/entities/User';

describe('User Entity', () => {
  describe('Factory Methods', () => {
    describe('createNew', () => {
      it('should create a new user with hashed password', async () => {
        const user = await User.createNew(
          'test@example.com',
          'ValidPass123',
          'artist'
        );

        expect(user.email).toBe('test@example.com');
        expect(user.role).toBe('artist');
        expect(user.active).toBe(true);
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash.length).toBeGreaterThan(50); // bcrypt hash
      });

      it('should normalize email to lowercase and trim', async () => {
        const user = await User.createNew(
          '  TEST@EXAMPLE.COM  ',
          'ValidPass123'
        );

        expect(user.email).toBe('test@example.com');
      });

      it('should default to artist role', async () => {
        const user = await User.createNew('test@example.com', 'ValidPass123');

        expect(user.role).toBe('artist');
      });

      it('should allow admin role', async () => {
        const user = await User.createNew(
          'admin@example.com',
          'ValidPass123',
          'admin'
        );

        expect(user.role).toBe('admin');
      });

      it('should reject password shorter than 8 characters', async () => {
        await expect(
          User.createNew('test@example.com', 'Short1')
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('should reject empty password', async () => {
        await expect(
          User.createNew('test@example.com', '')
        ).rejects.toThrow('Password must be at least 8 characters long');
      });
    });

    describe('fromDatabase', () => {
      it('should create user from database row', () => {
        const now = new Date();
        const user = User.fromDatabase(
          1,
          'test@example.com',
          '$2b$10$hashedpasswordhashedpasswordhashedpasswordhashedpass',
          'artist',
          true,
          now,
          now
        );

        expect(user.id).toBe(1);
        expect(user.email).toBe('test@example.com');
        expect(user.passwordHash).toBe('$2b$10$hashedpasswordhashedpasswordhashedpasswordhashedpass');
        expect(user.role).toBe('artist');
        expect(user.active).toBe(true);
        expect(user.createdAt).toBe(now);
        expect(user.updatedAt).toBe(now);
      });

      it('should throw on invalid email', () => {
        const now = new Date();
        expect(() =>
          User.fromDatabase(
            1,
            'invalid-email',
            '$2b$10$hashedpassword',
            'artist',
            true,
            now,
            now
          )
        ).toThrow('Invalid email: must be valid email format');
      });

      it('should throw on invalid password hash', () => {
        const now = new Date();
        expect(() =>
          User.fromDatabase(
            1,
            'test@example.com',
            'tooshort',
            'artist',
            true,
            now,
            now
          )
        ).toThrow('Invalid passwordHash: must be valid bcrypt hash');
      });
    });
  });

  describe('Password Verification', () => {
    it('should verify correct password', async () => {
      const password = 'ValidPass123';
      const user = await User.createNew('test@example.com', password);

      const isValid = await user.verifyPassword(password);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await User.createNew('test@example.com', 'ValidPass123');

      const isValid = await user.verifyPassword('WrongPass123');

      expect(isValid).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const user = await User.createNew('test@example.com', 'ValidPass123');

      const isValid = await user.verifyPassword('validpass123');

      expect(isValid).toBe(false);
    });
  });

  describe('Validation Methods', () => {
    describe('validateEmail', () => {
      it('should accept valid email', () => {
        const result = User.validateEmail('test@example.com');

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept email with subdomain', () => {
        const result = User.validateEmail('user@mail.example.com');

        expect(result.valid).toBe(true);
      });

      it('should reject email without @', () => {
        const result = User.validateEmail('testexample.com');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid email format');
      });

      it('should reject email without domain', () => {
        const result = User.validateEmail('test@');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid email format');
      });

      it('should reject empty email', () => {
        const result = User.validateEmail('');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Email is required');
      });

      it('should reject email longer than 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const result = User.validateEmail(longEmail);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Email must not exceed 255 characters');
      });
    });

    describe('validatePasswordStrength', () => {
      it('should accept strong password', () => {
        const result = User.validatePasswordStrength('ValidPass123');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject password without uppercase', () => {
        const result = User.validatePasswordStrength('validpass123');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must contain at least one uppercase letter'
        );
      });

      it('should reject password without lowercase', () => {
        const result = User.validatePasswordStrength('VALIDPASS123');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must contain at least one lowercase letter'
        );
      });

      it('should reject password without number', () => {
        const result = User.validatePasswordStrength('ValidPassword');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must contain at least one number'
        );
      });

      it('should reject password shorter than 8 characters', () => {
        const result = User.validatePasswordStrength('Pass1');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must be at least 8 characters long'
        );
      });

      it('should reject password longer than 128 characters', () => {
        const longPass = 'A'.repeat(130) + '1';
        const result = User.validatePasswordStrength(longPass);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Password must not exceed 128 characters'
        );
      });

      it('should return multiple errors for weak password', () => {
        const result = User.validatePasswordStrength('weak');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Business Logic Methods', () => {
    describe('isAdmin', () => {
      it('should return true for admin user', async () => {
        const user = await User.createNew(
          'admin@example.com',
          'ValidPass123',
          'admin'
        );

        expect(user.isAdmin()).toBe(true);
      });

      it('should return false for artist user', async () => {
        const user = await User.createNew(
          'artist@example.com',
          'ValidPass123',
          'artist'
        );

        expect(user.isAdmin()).toBe(false);
      });
    });

    describe('toPublic', () => {
      it('should return user data without password hash', async () => {
        const user = await User.createNew(
          'test@example.com',
          'ValidPass123',
          'artist'
        );

        const publicData = user.toPublic();

        expect(publicData.email).toBe('test@example.com');
        expect(publicData.role).toBe('artist');
        expect(publicData.active).toBe(true);
        expect(publicData.createdAt).toBeDefined();
        expect((publicData as any).passwordHash).toBeUndefined();
      });

      it('should have all required public fields', async () => {
        const user = await User.createNew('test@example.com', 'ValidPass123');

        const publicData = user.toPublic();

        expect(publicData).toHaveProperty('id');
        expect(publicData).toHaveProperty('email');
        expect(publicData).toHaveProperty('role');
        expect(publicData).toHaveProperty('active');
        expect(publicData).toHaveProperty('createdAt');
      });
    });
  });

  describe('Getters', () => {
    it('should expose all properties via getters', async () => {
      const user = await User.createNew('test@example.com', 'ValidPass123');

      expect(user.id).toBe(0); // Not set yet
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBeDefined();
      expect(user.role).toBe('artist');
      expect(user.active).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
