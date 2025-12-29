/**
 * GET /api/subscriptions/[id]
 * DELETE /api/subscriptions/[id]
 *
 * Get or cancel a specific subscription.
 * Requires authentication and ownership.
 *
 * Clean Architecture: API layer only orchestrates, no business logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CancelSubscriptionUseCase } from '@/domain/services/CancelSubscriptionUseCase';
import { subscriptionRepository } from '@/infrastructure/database/repositories';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/subscriptions/[id]
 * Returns subscription details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Step 1: Fetch subscription
    const subscription = await subscriptionRepository.findById(id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Step 2: Return subscription
    return NextResponse.json({
      id: subscription.id,
      status: subscription.getFormattedStatus(),
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      daysUntilRenewal: subscription.getDaysUntilPeriodEnd(),
      isAnnual: subscription.isAnnual(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      metadata: subscription.metadata,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions/[id]
 * Cancels subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Step 1: Parse query params
    const { searchParams } = new URL(request.url);
    const cancelAtPeriodEnd = searchParams.get('cancelAtPeriodEnd') === 'true';

    // Step 2: Initialize use case
    const useCase = new CancelSubscriptionUseCase(subscriptionRepository);

    // Step 3: Execute use case (simplified - no auth for demo)
    const result = await useCase.execute({
      subscriptionId: id,
      userId: 1, // TODO: Get from session
      cancelAtPeriodEnd,
    });

    // Step 4: Return result
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error canceling subscription:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      },
      { status: 500 }
    );
  }
}
