import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Hata: .env.local icinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanimlayin.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  try {
    const files = fs.readdirSync(migrationsDir)
                    .filter(f => f.endsWith('.sql'))
                    .sort();

    console.log(`Found ${files.length} migration files. Executing...`);

    for (const file of files) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Executing ${file}...`);
      console.log('--- Not: Supabase dashboard SQL Editor uzerinden calistirin. ---');
      break;
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

runMigrations();
