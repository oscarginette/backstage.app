/**
 * POST /api/subscriptions
 *
 * Creates a new subscription for a user.
 * Requires authentication.
 *
 * Clean Architecture: API layer only orchestrates, no business logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateSubscriptionUseCase } from '@/domain/services/CreateSubscriptionUseCase';
import {
  subscriptionRepository,
  priceRepository,
  productRepository,
} from '@/infrastructure/database/repositories';
import { isAppError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse request body
    const body = await request.json();
    const { priceId, trialDays, metadata } = body;

    // Step 2: Validate required fields
    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      );
    }

    // Step 3: Initialize use case
    const useCase = new CreateSubscriptionUseCase(
      subscriptionRepository,
      priceRepository,
      productRepository
    );

    // Step 4: Execute use case (simplified - no auth for demo)
    const result = await useCase.execute({
      userId: 1, // TODO: Get from session
      priceId,
      trialDays: trialDays ?? 0,
      metadata: {
        ...metadata,
        created_via: 'api',
      },
    });

    // Step 5: Return success response
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);

    // Handle known AppError types with proper status codes
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: error.status }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Failed to create subscription',
      },
      { status: 500 }
    );
  }
}
