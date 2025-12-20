import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );

    // Obtener todas las listas de contactos
    const response = await apiInstance.getLists();

    const lists = response.body.lists?.map((list: any) => ({
      id: list.id,
      name: list.name,
      totalSubscribers: list.totalSubscribers || 0
    })) || [];

    return NextResponse.json({ lists });

  } catch (error: any) {
    console.error('Error fetching Brevo lists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Brevo lists' },
      { status: 500 }
    );
  }
}
