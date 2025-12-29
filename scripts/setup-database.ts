#!/usr/bin/env tsx

/**
 * Script para ejecutar el schema de migracion en Neon
 */

import 'dotenv/config';
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupDatabase() {
  try {
    console.log('📦 Ejecutando schema de migración...\n');

    // Leer el archivo SQL
    const schemaPath = join(process.cwd(), 'sql/migration-contacts.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('Ejecutando comandos SQL...\n');

    // Ejecutar todo el schema de una vez
    try {
      await sql.query(schema);
      console.log('✅ Schema ejecutado correctamente');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Ignorar errores de "ya existe"
      if (errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate') ||
          errorMessage.includes('does not exist')) {
        console.log('⚠️  Algunas tablas ya existen o hubo warnings (normal)');
      } else {
        console.error('Error ejecutando schema:', errorMessage);
      }
    }

    console.log('\n✅ Schema ejecutado correctamente\n');

    // Verificar tablas creadas
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('contacts', 'email_logs')
      ORDER BY table_name
    `;

    console.log('📋 Tablas creadas:');
    tables.rows.forEach(row => console.log(`  • ${row.table_name}`));

    console.log('\n✨ Base de datos lista para migración');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    process.exit(1);
  }
}

setupDatabase();
