require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multi_canteen_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

const db = new Pool(DB_CONFIG);

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    
    // Read and execute the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await db.query(schema);
    
    // Insert sample data
    console.log('Inserting sample data...');
    
    // Hash password for sample users
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Sample super admin user
    await db.query(`
      INSERT INTO users (email, password, first_name, last_name, role) 
      VALUES ('admin@admin.com', $1, 'Super', 'Admin', 'super_admin')
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Sample student user
    await db.query(`
      INSERT INTO users (email, password, first_name, last_name, role) 
      VALUES ('student@test.com', $1, 'Test', 'Student', 'student')
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Sample canteens
    await db.query(`
      INSERT INTO canteens (name, description, location, opening_hours) VALUES
      ('North Canteen', 'Delicious North Indian cuisine', 'Near Library Block', '{"monday": "09:00-20:00", "tuesday": "09:00-20:00"}'),
      ('South Canteen', 'Authentic South Indian dishes', 'Near Hostel Complex', '{"monday": "09:00-20:00", "tuesday": "09:00-20:00"}'),
      ('Fast Food Corner', 'Quick bites and beverages', 'Main Campus', '{"monday": "08:00-22:00", "tuesday": "08:00-22:00"}')
      ON CONFLICT DO NOTHING;
    `);
    
    // Sample categories and menu items
    await db.query(`
      INSERT INTO menu_categories (canteen_id, name, description, sort_order) VALUES
      (1, 'Main Course', 'Full meals and curries', 1),
      (1, 'Snacks', 'Light bites and appetizers', 2),
      (1, 'Beverages', 'Hot and cold drinks', 3),
      (2, 'South Indian', 'Traditional South Indian dishes', 1),
      (2, 'Beverages', 'Filter coffee and more', 2),
      (3, 'Burgers', 'Various burger options', 1),
      (3, 'Beverages', 'Soft drinks and shakes', 2)
      ON CONFLICT DO NOTHING;
    `);
    
    await db.query(`
      INSERT INTO menu_items (canteen_id, category_id, name, description, price, is_vegetarian, preparation_time) VALUES
      (1, 1, 'Dal Rice', 'Traditional dal with steamed rice', 60.00, true, 15),
      (1, 1, 'Chicken Curry', 'Spicy chicken curry with rice', 120.00, false, 25),
      (1, 2, 'Samosa', 'Crispy samosa with chutney', 25.00, true, 10),
      (1, 3, 'Chai', 'Indian spiced tea', 15.00, true, 5),
      (2, 4, 'Masala Dosa', 'Crispy dosa with potato filling', 80.00, true, 20),
      (2, 4, 'Idli Sambhar', 'Steamed idli with sambhar', 50.00, true, 15),
      (2, 5, 'Filter Coffee', 'Traditional South Indian coffee', 20.00, true, 5),
      (3, 6, 'Veg Burger', 'Vegetarian burger with fries', 90.00, true, 15),
      (3, 6, 'Chicken Burger', 'Grilled chicken burger', 130.00, false, 20),
      (3, 7, 'Chocolate Shake', 'Rich chocolate milkshake', 60.00, true, 5)
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('Database migrations completed successfully!');
    console.log('Default login credentials:');
    console.log('Admin: admin@admin.com / password');
    console.log('Student: student@test.com / password');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.end();
  }
};

runMigrations();