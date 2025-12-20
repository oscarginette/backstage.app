import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Obtener configuración actual
export async function GET() {
  try {
    const result = await sql`
      SELECT brevo_list_ids FROM app_config WHERE id = 1
    `;

    let listIds: number[] = [];
    if (result.rows.length > 0 && result.rows[0].brevo_list_ids) {
      listIds = JSON.parse(result.rows[0].brevo_list_ids);
    }

    return NextResponse.json({ listIds });

  } catch (error: any) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Guardar configuración
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listIds } = body;

    if (!Array.isArray(listIds)) {
      return NextResponse.json(
        { error: 'listIds must be an array' },
        { status: 400 }
      );
    }

    // Validar que todos sean números
    if (!listIds.every((id) => typeof id === 'number')) {
      return NextResponse.json(
        { error: 'All list IDs must be numbers' },
        { status: 400 }
      );
    }

    // Insertar o actualizar configuración
    await sql`
      INSERT INTO app_config (id, brevo_list_ids, updated_at)
      VALUES (1, ${JSON.stringify(listIds)}, NOW())
      ON CONFLICT (id)
      DO UPDATE SET brevo_list_ids = ${JSON.stringify(listIds)}, updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      listIds
    });

  } catch (error: any) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
