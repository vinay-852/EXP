const axios = require('axios');
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

async function testUpdatePrice() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully!');
    
    // Get a sample item
    const itemsCheck = await client.query(`
      SELECT * FROM registration_items LIMIT 1
    `);
    
    if (itemsCheck.rows.length > 0) {
      const testItem = itemsCheck.rows[0];
      const testPrice = 999.99;
      
      console.log('Sample item from database:', testItem);
      
      // Test direct database update
      console.log(`\nTesting direct database update for item ${testItem.id} price to ${testPrice}...`);
      
      const dbUpdateResult = await client.query(`
        UPDATE registration_items 
        SET price = $1 
        WHERE id = $2 
        RETURNING *
      `, [testPrice, testItem.id]);
      
      console.log('Direct database update result:', dbUpdateResult.rows[0]);
      
      // Test API update
      const apiTestPrice = 888.88;
      console.log(`\nTesting API update for item ${testItem.id} price to ${apiTestPrice}...`);
      
      try {
        const response = await axios.put(`http://localhost:3000/registrations/items/${testItem.id}`, {
          quantity: testItem.quantity,
          price: apiTestPrice,
          unit: testItem.unit
        });
        
        console.log('API update response:', response.data);
      } catch (error) {
        console.error('Error calling API:', error.message);
        if (error.response) {
          console.error('API error response:', error.response.data);
        }
      }
      
      // Verify the update
      const verifyResult = await client.query(`
        SELECT * FROM registration_items 
        WHERE id = $1
      `, [testItem.id]);
      
      console.log('\nFinal state after updates:', verifyResult.rows[0]);
    } else {
      console.log('No items found to test price update.');
    }
  } catch (error) {
    console.error('Error testing price update:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testUpdatePrice(); 