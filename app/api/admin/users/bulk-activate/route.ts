/**
 * Bulk Activate Users API Route
 *
 * POST /api/admin/users/bulk-activate - Activate subscription plans for multiple users
 *
 * Clean Architecture: API route -> Use Case -> Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { USER_ROLES } from '@/domain/types/user-roles';

interface BulkActivateRequest {
  userIds: number[];
  plan: 'free' | 'pro' | 'business' | 'unlimited';
  billingCycle?: 'monthly' | 'annual';
  durationMonths: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: BulkActivateRequest = await request.json();

    // Validate input
    if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!body.plan || !['free', 'pro', 'business', 'unlimited'].includes(body.plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be one of: free, pro, business, unlimited' },
        { status: 400 }
      );
    }

    if (!body.durationMonths || body.durationMonths < 1 || body.durationMonths > 12) {
      return NextResponse.json(
        { error: 'durationMonths must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Execute use case
    const useCase = UseCaseFactory.createBulkActivateUsersUseCase();

    const result = await useCase.execute({
      adminUserId: parseInt(session.user.id),
      userIds: body.userIds,
      planName: body.plan,
      durationMonths: body.durationMonths,
    });

    return NextResponse.json(
      {
        success: true,
        activatedCount: result.successCount,
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors: result.errors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk activate users API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
