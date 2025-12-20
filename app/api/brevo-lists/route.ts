import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Temporalmente retornamos las listas hardcoded
  // TODO: Cuando tengamos API key con permisos, descomentar código de Brevo API

  const lists = [
    {
      id: 2,
      name: 'Lista 2',
      totalSubscribers: 0
    },
    {
      id: 3,
      name: 'Lista 3',
      totalSubscribers: 0
    }
  ];

  return NextResponse.json({ lists });
}

/* VERSIÓN CON BREVO API (descomentar cuando tengamos API key correcta)
import * as brevo from '@getbrevo/brevo';

export async function GET() {
  try {
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching Brevo lists with API key:', process.env.BREVO_API_KEY.substring(0, 20) + '...');

    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const response = await apiInstance.getLists();
    console.log('Brevo response:', response.response.statusCode);

    const lists = response.body.lists?.map((list: any) => ({
      id: list.id,
      name: list.name,
      totalSubscribers: list.totalSubscribers || 0
    })) || [];

    console.log('Found lists:', lists.length);
    return NextResponse.json({ lists });

  } catch (error: any) {
    console.error('Error fetching Brevo lists:', error);
    console.error('Error details:', error.response?.body || error.message);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch Brevo lists',
        details: error.response?.body || 'No additional details'
      },
      { status: 500 }
    );
  }
}
*/
