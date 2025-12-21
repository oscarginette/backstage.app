export class EmailMetrics {
  constructor(
    public readonly totalSent: number,
    public readonly totalDelivered: number,
    public readonly totalOpened: number,
    public readonly totalClicked: number,
    public readonly totalBounced: number
  ) {}

  get deliveryRate(): number {
    return this.totalSent > 0
      ? Math.round((this.totalDelivered / this.totalSent) * 10000) / 100
      : 0;
  }

  get openRate(): number {
    return this.totalDelivered > 0
      ? Math.round((this.totalOpened / this.totalDelivered) * 10000) / 100
      : 0;
  }

  get clickRate(): number {
    return this.totalOpened > 0
      ? Math.round((this.totalClicked / this.totalOpened) * 10000) / 100
      : 0;
  }

  get bounceRate(): number {
    return this.totalSent > 0
      ? Math.round((this.totalBounced / this.totalSent) * 10000) / 100
      : 0;
  }

  toJSON() {
    return {
      total_sent: this.totalSent,
      total_delivered: this.totalDelivered,
      total_opened: this.totalOpened,
      total_clicked: this.totalClicked,
      total_bounced: this.totalBounced,
      delivery_rate: this.deliveryRate,
      open_rate: this.openRate,
      click_rate: this.clickRate,
      bounce_rate: this.bounceRate
    };
  }
}
