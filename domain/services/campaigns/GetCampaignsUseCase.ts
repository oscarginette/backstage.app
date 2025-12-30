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

export interface GetCampaignsInput {
  userId: number;
  options?: FindCampaignsOptions;
}

export interface GetCampaignsResult {
  campaigns: EmailCampaign[];
  count: number;
}

/**
 * Use case for retrieving email campaigns
 *
 * Business Rules:
 * - Multi-tenant: Only returns campaigns for the authenticated user
 * - Returns all user's campaigns if no filters provided
 * - Supports filtering by status (draft/sent)
 * - Supports filtering by track ID or template ID
 * - Can filter to only scheduled campaigns (future scheduled_at)
 *
 * Security:
 * - Enforces user isolation (multi-tenant)
 * - userId MUST be provided from authenticated session
 */
export class GetCampaignsUseCase {
  constructor(
    private readonly campaignRepository: IEmailCampaignRepository
  ) {}

  /**
   * Execute the use case
   *
   * @param input - User ID (required) and optional filters
   * @returns List of campaigns matching filters for the authenticated user
   */
  async execute(input: GetCampaignsInput): Promise<GetCampaignsResult> {
    const campaigns = await this.campaignRepository.findAll({
      ...input.options,
      userId: input.userId
    });

    return {
      campaigns,
      count: campaigns.length
    };
  }
}
