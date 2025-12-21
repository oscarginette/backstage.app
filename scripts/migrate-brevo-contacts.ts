#!/usr/bin/env tsx

/**
 * Script CLI para migrar contactos desde Brevo a Neon
 *
 * Uso:
 *   npm run migrate-contacts
 *   o
 *   npx tsx scripts/migrate-brevo-contacts.ts
 */

import 'dotenv/config';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function migrateContacts() {
  console.log('🚀 Iniciando migración de contactos desde Brevo a Neon...\n');

  // 1. Verificar estado actual
  console.log('📊 Verificando estado actual de la base de datos...');
  const statusResponse = await fetch(`${API_URL}/api/migrate-contacts`);

  if (!statusResponse.ok) {
    throw new Error(`Error obteniendo estado: ${statusResponse.statusText}`);
  }

  const statusData = await statusResponse.json();
  console.log('Estado actual:', statusData.database);
  console.log('');

  // 2. Confirmar migración
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise<string>((resolve) => {
    readline.question(
      '¿Deseas continuar con la migración? (yes/no): ',
      resolve
    );
  });

  readline.close();

  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('❌ Migración cancelada');
    process.exit(0);
  }

  // 3. Ejecutar migración
  console.log('\n⏳ Ejecutando migración... (esto puede tardar varios minutos)\n');

  const startTime = Date.now();
  const migrationResponse = await fetch(`${API_URL}/api/migrate-contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!migrationResponse.ok) {
    const errorData = await migrationResponse.json();
    throw new Error(`Error en migración: ${errorData.error || errorData.message}`);
  }

  const result = await migrationResponse.json();

  // 4. Mostrar resultados
  console.log('\n✅ MIGRACIÓN COMPLETADA\n');
  console.log('═══════════════════════════════════════');
  console.log('📥 MIGRACIÓN:');
  console.log(`  • Contactos obtenidos de Brevo: ${result.migration.contactsFetched}`);
  console.log(`  • Nuevos contactos insertados: ${result.migration.contactsInserted}`);
  console.log(`  • Contactos actualizados: ${result.migration.contactsUpdated}`);
  console.log(`  • Contactos con errores: ${result.migration.contactsSkipped}`);
  console.log(`  • Listas procesadas: ${result.migration.listsProcessed}`);
  console.log(`  • Duración: ${(result.migration.duration / 1000).toFixed(2)}s`);

  console.log('\n💾 BASE DE DATOS NEON:');
  console.log(`  • Total de contactos: ${result.database.totalContacts}`);
  console.log(`  • Suscritos activos: ${result.database.activeSubscribers}`);
  console.log(`  • No suscritos: ${result.database.unsubscribed}`);
  console.log(`  • Migrados desde Brevo: ${result.database.fromBrevo}`);

  if (result.migration.errors && result.migration.errors.length > 0) {
    console.log('\n⚠️  ERRORES (primeros 10):');
    result.migration.errors.forEach((error: string) => {
      console.log(`  • ${error}`);
    });
  }

  console.log('═══════════════════════════════════════\n');
}

// Ejecutar
migrateContacts()
  .then(() => {
    console.log('✨ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
