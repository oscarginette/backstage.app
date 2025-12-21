export class Url {
  private readonly value: string;

  constructor(url: string) {
    this.validate(url);
    this.value = url;
  }

  private validate(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new Error('URL cannot be empty');
    }

    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Url): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
