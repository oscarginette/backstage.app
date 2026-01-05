/**
 * ContactList Entity
 *
 * Represents a user-defined list for organizing contacts.
 * Immutable entity following Clean Architecture principles.
 */

import { LIST_LIMITS, type ListColor } from '../types/list-colors';

export class ContactList {
  constructor(
    public readonly id: string,
    public readonly userId: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly color: ListColor,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly metadata?: Record<string, unknown>
  ) {
    this.validate();
  }

  /**
   * Validates ContactList business rules
   */
  private validate(): void {
    const trimmedName = this.name.trim();

    if (trimmedName.length === 0) {
      throw new Error('List name cannot be empty');
    }

    if (this.name.length > LIST_LIMITS.MAX_NAME_LENGTH) {
      throw new Error(
        `List name cannot exceed ${LIST_LIMITS.MAX_NAME_LENGTH} characters`
      );
    }

    if (
      this.description &&
      this.description.length > LIST_LIMITS.MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        `Description cannot exceed ${LIST_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
      );
    }

    if (!this.isValidHexColor(this.color)) {
      throw new Error('Color must be a valid hex code');
    }
  }

  /**
   * Validates hex color format (#RRGGBB)
   */
  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Factory method to create ContactList from database row
   */
  static fromDatabase(row: any): ContactList {
    return new ContactList(
      row.id,
      row.user_id,
      row.name,
      row.description ?? null,
      row.color,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.metadata
    );
  }

  /**
   * Returns display color (falls back to default if null)
   */
  getDisplayColor(): string {
    return this.color || '#6366F1';
  }
}
