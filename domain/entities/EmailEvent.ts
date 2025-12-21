export type EmailEventType = 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'failed';

export class EmailEvent {
  constructor(
    public readonly id: number,
    public readonly contactId: number,
    public readonly trackId: string,
    public readonly type: EmailEventType,
    public readonly resendEmailId?: string | null,
    public readonly error?: string | null,
    public readonly createdAt?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    const validTypes: EmailEventType[] = ['sent', 'delivered', 'bounced', 'opened', 'clicked', 'failed'];
    if (!validTypes.includes(this.type)) {
      throw new Error(`Invalid email event type: ${this.type}`);
    }

    if (this.type === 'failed' && !this.error) {
      throw new Error('Failed events must have an error message');
    }
  }

  isSuccess(): boolean {
    return this.type !== 'failed' && this.type !== 'bounced';
  }

  isFailed(): boolean {
    return this.type === 'failed' || this.type === 'bounced';
  }

  isEngagement(): boolean {
    return this.type === 'opened' || this.type === 'clicked';
  }

  static create(props: {
    id: number;
    contactId: number;
    trackId: string;
    type: EmailEventType;
    resendEmailId?: string | null;
    error?: string | null;
    createdAt?: Date;
  }): EmailEvent {
    return new EmailEvent(
      props.id,
      props.contactId,
      props.trackId,
      props.type,
      props.resendEmailId,
      props.error,
      props.createdAt
    );
  }
}
