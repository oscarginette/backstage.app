/**
 * EmailContentValidation Tests
 *
 * Tests validation rules for email content
 */

import { EmailContentValidation } from '@/domain/value-objects/EmailContentValidation';

describe('EmailContentValidation', () => {
  describe('Subject Validation', () => {
    it('should fail when subject is empty', () => {
      const validation = new EmailContentValidation({
        subject: '',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(false);
      expect(validation.hasFieldErrors('subject')).toBe(true);
      expect(validation.getFieldErrors('subject')[0].message).toBe('Subject is required');
    });

    it('should fail when subject is only whitespace', () => {
      const validation = new EmailContentValidation({
        subject: '   ',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(false);
      expect(validation.hasFieldErrors('subject')).toBe(true);
    });

    it('should fail when subject exceeds 500 characters', () => {
      const validation = new EmailContentValidation({
        subject: 'a'.repeat(501),
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(false);
      expect(validation.hasFieldErrors('subject')).toBe(true);
      expect(validation.getFieldErrors('subject')[0].message).toContain('500 characters');
    });

    it('should pass when subject is valid (1-500 chars)', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(true);
      expect(validation.hasFieldErrors('subject')).toBe(false);
    });
  });

  describe('Greeting Validation', () => {
    it('should pass when greeting is empty (optional field)', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: '',
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(true);
      expect(validation.hasFieldErrors('greeting')).toBe(false);
    });

    it('should fail when greeting exceeds 200 characters', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'a'.repeat(201),
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(false);
      expect(validation.hasFieldErrors('greeting')).toBe(true);
      expect(validation.getFieldErrors('greeting')[0].message).toContain('200 characters');
    });
  });

  describe('Message Validation', () => {
    it('should pass when message is empty (optional field)', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'Hello',
        message: '',
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(true);
      expect(validation.hasFieldErrors('message')).toBe(false);
    });

    it('should fail when message exceeds 5000 characters', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'Hello',
        message: 'a'.repeat(5001),
        signature: 'Best regards'
      });

      expect(validation.isValid()).toBe(false);
      expect(validation.hasFieldErrors('message')).toBe(true);
      expect(validation.getFieldErrors('message')[0].message).toContain('5000 characters');
    });
  });

  describe('Signature Validation', () => {
    it('should pass when signature is empty (optional field)', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'Hello',
        message: 'Test message',
        signature: ''
      });

      expect(validation.isValid()).toBe(true);
      expect(validation.hasFieldErrors('signature')).toBe(false);
    });

    it('should fail when signature exceeds 500 characters', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'a'.repeat(501)
      });

      expect(validation.isValid()).toBe(false);
      expect(validation.hasFieldErrors('signature')).toBe(true);
      expect(validation.getFieldErrors('signature')[0].message).toContain('500 characters');
    });
  });

  describe('Multiple Errors', () => {
    it('should collect all validation errors', () => {
      const validation = new EmailContentValidation({
        subject: '',
        greeting: 'a'.repeat(201),
        message: 'a'.repeat(5001),
        signature: 'a'.repeat(501)
      });

      expect(validation.isValid()).toBe(false);
      expect(validation.getErrors()).toHaveLength(4);
      expect(validation.hasFieldErrors('subject')).toBe(true);
      expect(validation.hasFieldErrors('greeting')).toBe(true);
      expect(validation.hasFieldErrors('message')).toBe(true);
      expect(validation.hasFieldErrors('signature')).toBe(true);
    });
  });

  describe('Validation Summary', () => {
    it('should return success message when valid', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.getValidationSummary()).toBe('All fields are valid');
    });

    it('should return error summary when invalid', () => {
      const validation = new EmailContentValidation({
        subject: '',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      const summary = validation.getValidationSummary();
      expect(summary).toContain('Subject is required');
    });
  });

  describe('Save Button Tooltip', () => {
    it('should return "Save draft" when valid', () => {
      const validation = new EmailContentValidation({
        subject: 'Valid subject',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      expect(validation.getSaveButtonTooltip()).toBe('Save draft');
    });

    it('should return error messages when invalid', () => {
      const validation = new EmailContentValidation({
        subject: '',
        greeting: 'Hello',
        message: 'Test message',
        signature: 'Best regards'
      });

      const tooltip = validation.getSaveButtonTooltip();
      expect(tooltip).toContain('Cannot save draft:');
      expect(tooltip).toContain('Subject is required');
    });
  });
});
