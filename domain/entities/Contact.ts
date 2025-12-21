import { Email } from '../value-objects/Email';

export class Contact {
  constructor(
    public readonly id: number,
    public readonly email: Email,
    public readonly unsubscribeToken: string,
    public readonly subscribed: boolean,
    public readonly name?: string | null,
    public readonly createdAt?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.unsubscribeToken || this.unsubscribeToken.trim().length === 0) {
      throw new Error('Unsubscribe token cannot be empty');
    }

    if (this.name && this.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }
  }

  isSubscribed(): boolean {
    return this.subscribed;
  }

  getUnsubscribeUrl(baseUrl: string): string {
    return `${baseUrl}/unsubscribe?token=${this.unsubscribeToken}`;
  }

  static create(props: {
    id: number;
    email: string;
    unsubscribeToken: string;
    subscribed: boolean;
    name?: string | null;
    createdAt?: Date;
  }): Contact {
    return new Contact(
      props.id,
      new Email(props.email),
      props.unsubscribeToken,
      props.subscribed,
      props.name,
      props.createdAt
    );
  }
}
