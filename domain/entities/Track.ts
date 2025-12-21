import { TrackId } from '../value-objects/TrackId';
import { Url } from '../value-objects/Url';

export class Track {
  constructor(
    public readonly id: TrackId,
    public readonly title: string,
    public readonly url: Url,
    public readonly publishedAt: Date,
    public readonly coverImage?: string | null,
    public readonly createdAt?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Track title cannot be empty');
    }

    if (this.title.length > 200) {
      throw new Error('Track title cannot exceed 200 characters');
    }
  }

  isPublished(): boolean {
    return this.publishedAt <= new Date();
  }

  hasCover(): boolean {
    return !!this.coverImage;
  }

  static create(props: {
    trackId: string;
    title: string;
    url: string;
    publishedAt?: string | Date;
    coverImage?: string | null;
  }): Track {
    return new Track(
      new TrackId(props.trackId),
      props.title,
      new Url(props.url),
      props.publishedAt ? new Date(props.publishedAt) : new Date(),
      props.coverImage
    );
  }
}
