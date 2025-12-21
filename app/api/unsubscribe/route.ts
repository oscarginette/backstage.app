import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para procesar unsubscribes
 *
 * Acepta tanto GET como POST
 * Query params: ?token=xxx
 */
export async function GET(request: Request) {
  return handleUnsubscribe(request);
}

export async function POST(request: Request) {
  return handleUnsubscribe(request);
}

async function handleUnsubscribe(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Buscar contacto por token y desuscribirlo
    const result = await sql`
      UPDATE contacts
      SET
        subscribed = false,
        unsubscribed_at = CURRENT_TIMESTAMP
      WHERE
        unsubscribe_token = ${token}
        AND subscribed = true
      RETURNING id, email
    `;

    if (result.rows.length === 0) {
      // El token no existe o ya estaba desuscrito
      const checkToken = await sql`
        SELECT id, email, subscribed
        FROM contacts
        WHERE unsubscribe_token = ${token}
      `;

      if (checkToken.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid unsubscribe token' },
          { status: 404 }
        );
      }

      // Ya estaba desuscrito
      return NextResponse.json({
        success: true,
        message: 'Already unsubscribed',
        email: checkToken.rows[0].email
      });
    }

    const contact = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
      email: contact.email
    });

  } catch (error: any) {
    console.error('Error in unsubscribe:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
