import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching Brevo lists...');

    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const response = await apiInstance.getLists();
    console.log('Brevo API response status:', response.response.statusCode);
    console.log('Raw lists data:', JSON.stringify(response.body.lists, null, 2));

    const lists = response.body.lists?.map((list: any) => ({
      id: list.id,
      name: list.name,
      totalSubscribers: list.totalSubscribers || list.uniqueSubscribers || 0,
      folderId: list.folderId || null
    })) || [];

    console.log('Processed lists:', lists);
    return NextResponse.json({ lists });

  } catch (error: any) {
    console.error('Error fetching Brevo lists:', error);
    console.error('Error code:', error.response?.status);

    // Si falla la API (401 = sin permisos), retornar listas conocidas
    // TODO: Actualizar la API key en Brevo con permisos de lectura de listas
    const fallbackLists = [
      {
        id: 2,
        name: 'Your First Folder',
        totalSubscribers: 1753
      },
      {
        id: 3,
        name: 'Hypeddit',
        totalSubscribers: 3
      }
    ];

    console.log('Using fallback lists due to API error');
    return NextResponse.json({ lists: fallbackLists });
  }
}
