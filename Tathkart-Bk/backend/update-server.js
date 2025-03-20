const fs = require('fs');
const path = require('path');

// Read the server.js file
const serverFilePath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Find the section where we add items to registration
const addItemRegex = /app\.post\('\/registrations\/:hotelId\/items'[\s\S]*?try\s*{[\s\S]*?const result = await pool\.query\(\s*'INSERT INTO registration_items[\s\S]*?\[hotelId, item_id,/;

// Replace it with the updated code that handles manual items
const updatedCode = `app.post('/registrations/:hotelId/items', async (req, res) => {
  const { hotelId } = req.params;
  const { item_id, name, price, unit, quantity, is_manual } = req.body;

  try {
    console.log('Adding item to registration:', req.body);
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    
    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'Item price is required' });
    }
    
    if (!unit) {
      return res.status(400).json({ error: 'Item unit is required' });
    }
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Item quantity is required' });
    }
    
    // Check if the registration exists
    const registrationCheck = await pool.query(
      'SELECT * FROM registrations WHERE hotel_id = $1',
      [hotelId]
    );

    if (registrationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // For manual items, we set item_id to null
    const finalItemId = is_manual ? null : item_id;
    
    // Insert the item
    const result = await pool.query(
      'INSERT INTO registration_items (registration_id, item_id, name, price, unit, quantity, is_manual) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [hotelId, finalItemId, name, price, unit, quantity, is_manual]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding item to registration:', error);
    return res.status(500).json({ error: 'An error occurred while adding the item' });
  }
});`;

// Update the server.js content
if (addItemRegex.test(serverContent)) {
  serverContent = serverContent.replace(addItemRegex, updatedCode);
  
  // Write the updated content back to server.js
  fs.writeFileSync(serverFilePath, serverContent, 'utf8');
  console.log('Server.js updated successfully!');
} else {
  console.error('Could not find the section to update in server.js');
} 