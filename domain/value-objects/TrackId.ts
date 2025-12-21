export class TrackId {
  private readonly value: string;

  constructor(trackId: string) {
    this.validate(trackId);
    this.value = trackId;
  }

  private validate(trackId: string): void {
    if (!trackId || trackId.trim().length === 0) {
      throw new Error('TrackId cannot be empty');
    }

    // SoundCloud track IDs are typically numeric strings
    if (!/^\d+$/.test(trackId)) {
      throw new Error(`Invalid TrackId format: ${trackId}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TrackId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
