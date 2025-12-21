import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY not configured' },
        { status: 500 }
      );
    }

    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    console.log('Fetching Brevo lists...');
    const listsResponse = await apiInstance.getLists();
    const lists = listsResponse.body.lists || [];

    const detailedLists = [];

    for (const list of lists) {
      try {
        // Obtener muestra de contactos de cada lista
        const contactsResponse = await apiInstance.getContactsFromList(
          list.id,
          undefined,
          5, // Solo 5 como muestra
          0
        );

        const contacts = contactsResponse.body.contacts || [];

        detailedLists.push({
          id: list.id,
          name: list.name,
          totalSubscribers: list.totalSubscribers || list.uniqueSubscribers || 0,
          folderId: list.folderId || null,
          sampleContacts: contacts.map(c => ({
            email: c.email,
            id: c.id,
            listIds: c.listIds,
            emailBlacklisted: c.emailBlacklisted
          }))
        });

      } catch (error: any) {
        detailedLists.push({
          id: list.id,
          name: list.name,
          totalSubscribers: list.totalSubscribers || list.uniqueSubscribers || 0,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      totalLists: lists.length,
      lists: detailedLists
    });

  } catch (error: any) {
    console.error('Error checking Brevo:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to check Brevo',
        details: error.message
      },
      { status: 500 }
    );
  }
}
