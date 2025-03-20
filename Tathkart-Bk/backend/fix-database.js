const { Pool } = require('pg');

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-twilight-forest-a1hqi35y-pooler.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_cpEC40PkfKjH', 
  port: 5432,
  ssl: {
    rejectUnauthorized: true
  }
});

async function fixDatabase() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully!');

    // Check if registration_items table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'registration_items'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating registration_items table...');
      await client.query(`
        CREATE TABLE registration_items (
          id SERIAL PRIMARY KEY,
          registration_id VARCHAR(255) NOT NULL,
          item_id VARCHAR(255) NULL,
          name VARCHAR(255) NOT NULL,
          price NUMERIC DEFAULT 0,
          unit VARCHAR(50) DEFAULT 'item',
          quantity INTEGER DEFAULT 1,
          is_manual BOOLEAN DEFAULT FALSE
        )
      `);
      console.log('Table created successfully!');
    } else {
      console.log('Table registration_items already exists.');
      
      // Make item_id nullable
      console.log('Making item_id column nullable...');
      try {
        await client.query(`
          ALTER TABLE registration_items 
          ALTER COLUMN item_id DROP NOT NULL;
        `);
        console.log('item_id column is now nullable.');
      } catch (error) {
        console.error('Error making item_id nullable:', error.message);
      }
      
      // Check and add missing columns
      const columns = [
        { name: 'registration_id', type: 'VARCHAR(255)', default: 'NOT NULL' },
        { name: 'item_id', type: 'VARCHAR(255)', default: 'NULL' },
        { name: 'name', type: 'VARCHAR(255)', default: 'NOT NULL' },
        { name: 'price', type: 'NUMERIC', default: '0' },
        { name: 'unit', type: 'VARCHAR(50)', default: '\'item\'' },
        { name: 'quantity', type: 'INTEGER', default: '1' },
        { name: 'is_manual', type: 'BOOLEAN', default: 'FALSE' }
      ];
      
      for (const column of columns) {
        const columnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'registration_items'
            AND column_name = '${column.name}'
          )
        `);
        
        if (!columnCheck.rows[0].exists) {
          console.log(`Adding missing column: ${column.name}`);
          await client.query(`
            ALTER TABLE registration_items 
            ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}
          `);
          console.log(`Column ${column.name} added successfully!`);
        } else {
          console.log(`Column ${column.name} already exists.`);
        }
      }
    }
    
    // Show current table structure
    console.log('\nCurrent table structure:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'registration_items'
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}, Default: ${col.column_default || 'NULL'})`);
    });
    
    console.log('\nDatabase fix completed successfully!');
  } catch (error) {
    console.error('Error fixing database:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixDatabase(); 