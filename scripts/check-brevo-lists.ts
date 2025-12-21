#!/usr/bin/env tsx

/**
 * Script para verificar listas y contactos en Brevo
 */

import 'dotenv/config';
import * as brevo from '@getbrevo/brevo';

async function checkBrevoLists() {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    console.log('📋 Obteniendo listas de Brevo...\n');

    const listsResponse = await apiInstance.getLists();
    const lists = listsResponse.body.lists || [];

    console.log(`Encontradas ${lists.length} listas:\n`);

    for (const list of lists) {
      console.log(`📁 Lista: "${list.name}" (ID: ${list.id})`);
      console.log(`   Contactos: ${list.totalSubscribers || list.uniqueSubscribers || 0}`);
      console.log(`   Folder ID: ${list.folderId || 'N/A'}`);
      console.log('');
    }

    // Obtener estadísticas de cada lista
    console.log('\n🔍 Obteniendo muestra de contactos de cada lista...\n');

    for (const list of lists) {
      try {
        const contactsResponse = await apiInstance.getContactsFromList(
          list.id,
          undefined,
          5, // Solo 5 contactos como muestra
          0
        );

        const contacts = contactsResponse.body.contacts || [];

        console.log(`\n📧 Lista "${list.name}" - Primeros ${contacts.length} contactos:`);
        contacts.forEach((contact, idx) => {
          console.log(`   ${idx + 1}. ${contact.email} (ID: ${contact.id})`);
        });

      } catch (error: any) {
        console.log(`   ❌ Error obteniendo contactos: ${error.message}`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBrevoLists();
