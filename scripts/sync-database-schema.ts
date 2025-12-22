/**
 * Auto-sync Database Schema Documentation
 *
 * This script:
 * 1. Connects to the database
 * 2. Fetches all table structures
 * 3. Updates .claude/skills/database-schema.md
 * 4. Preserves manual documentation sections
 */

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: string;
  default: string | null;
}

interface IndexInfo {
  indexName: string;
  definition: string;
}

async function syncDatabaseSchema() {
  console.log('🔄 Syncing database schema documentation...\n');

  // Get all tables
  console.log('Step 1: Fetching table list...');
  const tablesResult = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const tables: string[] = tablesResult.rows.map((row: any) => row.table_name);
  console.log(`✅ Found ${tables.length} tables\n`);

  // Get structure for each table
  console.log('Step 2: Fetching table structures...');
  const tableInfos: TableInfo[] = [];

  for (const tableName of tables) {
    // Get columns
    const columnsResult = await sql`
      SELECT
        column_name as name,
        data_type as type,
        is_nullable as nullable,
        column_default as default
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position
    `;

    // Get indexes
    const indexesResult = await sql`
      SELECT
        indexname as index_name,
        indexdef as definition
      FROM pg_indexes
      WHERE tablename = ${tableName}
    `;

    tableInfos.push({
      tableName,
      columns: columnsResult.rows as ColumnInfo[],
      indexes: indexesResult.rows as IndexInfo[]
    });

    console.log(`  ✅ ${tableName} (${columnsResult.rows.length} columns, ${indexesResult.rows.length} indexes)`);
  }

  console.log('\nStep 3: Generating documentation...\n');

  // Generate table list section
  let tableListMd = '## 📊 Database Tables (Auto-generated)\n\n';
  tableListMd += `**Last sync:** ${new Date().toISOString()}\n`;
  tableListMd += `**Total tables:** ${tables.length}\n\n`;
  tableListMd += '```\n';
  tables.forEach(table => {
    tableListMd += `  - ${table}\n`;
  });
  tableListMd += '```\n\n';

  // Generate detailed structures
  let detailsMd = '## 📋 Table Structures (Auto-generated)\n\n';

  for (const tableInfo of tableInfos) {
    detailsMd += `### \`${tableInfo.tableName}\`\n\n`;

    // Columns table
    detailsMd += '| Column | Type | Nullable | Default |\n';
    detailsMd += '|--------|------|----------|----------|\n';

    for (const col of tableInfo.columns) {
      const nullable = col.nullable === 'YES' ? '✓' : '✗';
      const defaultVal = col.default || '-';
      detailsMd += `| \`${col.name}\` | ${col.type} | ${nullable} | ${defaultVal} |\n`;
    }

    detailsMd += '\n';

    // Indexes
    if (tableInfo.indexes.length > 0) {
      detailsMd += '**Indexes:**\n';
      for (const idx of tableInfo.indexes) {
        detailsMd += `- \`${idx.indexName}\`\n`;
      }
      detailsMd += '\n';
    }

    detailsMd += '---\n\n';
  }

  // Save to file
  const outputPath = join(process.cwd(), '.claude', 'skills', 'database-schema-auto.md');
  const output = `# Database Schema Auto-Sync\n\n${tableListMd}${detailsMd}`;

  writeFileSync(outputPath, output, 'utf-8');
  console.log(`✅ Documentation saved to: ${outputPath}\n`);

  // Also update the main schema file with timestamp
  const mainSchemaPath = join(process.cwd(), '.claude', 'skills', 'database-schema.md');
  let mainSchema = readFileSync(mainSchemaPath, 'utf-8');

  // Update the auto-updated timestamp
  mainSchema = mainSchema.replace(
    /\*\*Auto-updated:\*\* .+/,
    `**Auto-updated:** ${new Date().toISOString().split('T')[0]}`
  );

  mainSchema = mainSchema.replace(
    /\*\*Last sync:\*\* .+/,
    `**Last sync:** ${new Date().toLocaleString()}`
  );

  writeFileSync(mainSchemaPath, mainSchema, 'utf-8');
  console.log(`✅ Updated main schema file\n`);

  console.log('✅ Schema sync completed!\n');
  console.log('📝 Files updated:');
  console.log(`   - .claude/skills/database-schema.md (timestamps)`);
  console.log(`   - .claude/skills/database-schema-auto.md (full structures)\n`);
}

syncDatabaseSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Schema sync failed:', error);
    process.exit(1);
  });
