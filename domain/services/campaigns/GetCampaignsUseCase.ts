/**
 * GetCampaignsUseCase
 *
 * Retrieves email campaigns with optional filtering.
 * Supports filtering by status, track ID, template ID, and scheduled campaigns.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles campaign retrieval
 * - Dependency Inversion: Depends on IEmailCampaignRepository interface
 * - Interface Segregation: Uses minimal repository interface
 */

import {
  IEmailCampaignRepository,
  EmailCampaign,
  FindCampaignsOptions
} from '@/domain/repositories/IEmailCampaignRepository';

export interface GetCampaignsResult {
  campaigns: EmailCampaign[];
  count: number;
}

/**
 * Use case for retrieving email campaigns
 *
 * Business Rules:
 * - Returns all campaigns if no filters provided
 * - Supports filtering by status (draft/sent)
 * - Supports filtering by track ID or template ID
 * - Can filter to only scheduled campaigns (future scheduled_at)
 */
export class GetCampaignsUseCase {
  constructor(
    private readonly campaignRepository: IEmailCampaignRepository
  ) {}

  /**
   * Execute the use case
   *
   * @param options - Optional filters for campaigns
   * @returns List of campaigns matching filters
   */
  async execute(options?: FindCampaignsOptions): Promise<GetCampaignsResult> {
    const campaigns = await this.campaignRepository.findAll(options);

    return {
      campaigns,
      count: campaigns.length
    };
  }
}
