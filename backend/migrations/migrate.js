const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const fs = require('fs');
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
    
    // Read and execute the schema file (tables only)
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schema);

    // Deduplicate any pre-existing data to allow unique indexes
    console.log('Cleaning up duplicates (if any)...');
    // 1) Merge duplicate canteens by name: reassign FKs then delete dups
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, name FROM canteens GROUP BY name
      ), dups AS (
        SELECT c.id AS dup_id, canon.keep_id
        FROM canteens c
        JOIN canon ON canon.name = c.name
        WHERE c.id <> canon.keep_id
      )
      UPDATE menu_categories mc
      SET canteen_id = d.keep_id
      FROM dups d
      WHERE mc.canteen_id = d.dup_id;
    `);
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, name FROM canteens GROUP BY name
      ), dups AS (
        SELECT c.id AS dup_id, canon.keep_id
        FROM canteens c
        JOIN canon ON canon.name = c.name
        WHERE c.id <> canon.keep_id
      )
      UPDATE menu_items mi
      SET canteen_id = d.keep_id
      FROM dups d
      WHERE mi.canteen_id = d.dup_id;
    `);
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, name FROM canteens GROUP BY name
      ), dups AS (
        SELECT c.id AS dup_id, canon.keep_id
        FROM canteens c
        JOIN canon ON canon.name = c.name
        WHERE c.id <> canon.keep_id
      )
      UPDATE orders o
      SET canteen_id = d.keep_id
      FROM dups d
      WHERE o.canteen_id = d.dup_id;
    `);
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, name FROM canteens GROUP BY name
      ), dups AS (
        SELECT c.id AS dup_id, canon.keep_id
        FROM canteens c
        JOIN canon ON canon.name = c.name
        WHERE c.id <> canon.keep_id
      )
      UPDATE reviews r
      SET canteen_id = d.keep_id
      FROM dups d
      WHERE r.canteen_id = d.dup_id;
    `);
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, name FROM canteens GROUP BY name
      ), dups AS (
        SELECT c.id AS dup_id, canon.keep_id
        FROM canteens c
        JOIN canon ON canon.name = c.name
        WHERE c.id <> canon.keep_id
      )
      DELETE FROM canteens c USING dups d WHERE c.id = d.dup_id;
    `);

    // 2) Merge duplicate menu categories per (canteen_id, name)
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, canteen_id, name FROM menu_categories GROUP BY canteen_id, name
      ), dups AS (
        SELECT mc.id AS dup_id, canon.keep_id
        FROM menu_categories mc
        JOIN canon ON canon.canteen_id = mc.canteen_id AND canon.name = mc.name
        WHERE mc.id <> canon.keep_id
      )
      UPDATE menu_items mi
      SET category_id = d.keep_id
      FROM dups d
      WHERE mi.category_id = d.dup_id;
    `);
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, canteen_id, name FROM menu_categories GROUP BY canteen_id, name
      ), dups AS (
        SELECT mc.id AS dup_id, canon.keep_id
        FROM menu_categories mc
        JOIN canon ON canon.canteen_id = mc.canteen_id AND canon.name = mc.name
        WHERE mc.id <> canon.keep_id
      )
      DELETE FROM menu_categories mc USING dups d WHERE mc.id = d.dup_id;
    `);

    // 3) Merge duplicate menu items per (category_id, name)
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, category_id, name FROM menu_items GROUP BY category_id, name
      ), dups AS (
        SELECT mi.id AS dup_id, canon.keep_id
        FROM menu_items mi
        JOIN canon ON canon.category_id = mi.category_id AND canon.name = mi.name
        WHERE mi.id <> canon.keep_id
      )
      UPDATE order_items oi
      SET menu_item_id = d.keep_id
      FROM dups d
      WHERE oi.menu_item_id = d.dup_id;
    `);
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, category_id, name FROM menu_items GROUP BY category_id, name
      ), dups AS (
        SELECT mi.id AS dup_id, canon.keep_id
        FROM menu_items mi
        JOIN canon ON canon.category_id = mi.category_id AND canon.name = mi.name
        WHERE mi.id <> canon.keep_id
      )
      UPDATE reviews r
      SET menu_item_id = d.keep_id
      FROM dups d
      WHERE r.menu_item_id = d.dup_id;
    `);
    await db.query(`
      WITH canon AS (
        SELECT MIN(id) AS keep_id, category_id, name FROM menu_items GROUP BY category_id, name
      ), dups AS (
        SELECT mi.id AS dup_id, canon.keep_id
        FROM menu_items mi
        JOIN canon ON canon.category_id = mi.category_id AND canon.name = mi.name
        WHERE mi.id <> canon.keep_id
      )
      DELETE FROM menu_items mi USING dups d WHERE mi.id = d.dup_id;
    `);

    // Create unique indexes after cleanup
    console.log('Creating unique indexes...');
    await db.query(`
      DO $$ BEGIN
        IF to_regclass('public.canteens') IS NOT NULL THEN
          CREATE UNIQUE INDEX IF NOT EXISTS idx_canteens_name_unique ON canteens(name);
        END IF;
      END $$;
    `);
    await db.query(`
      DO $$ BEGIN
        IF to_regclass('public.menu_categories') IS NOT NULL THEN
          CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_categories_canteen_name_unique ON menu_categories(canteen_id, name);
        END IF;
      END $$;
    `);
    await db.query(`
      DO $$ BEGIN
        IF to_regclass('public.menu_items') IS NOT NULL THEN
          CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_category_name_unique ON menu_items(category_id, name);
        END IF;
      END $$;
    `);
    
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
    
    // Sample canteens (idempotent by name)
    await db.query(`
      INSERT INTO canteens (name, description, location, opening_hours) VALUES
      ('North Canteen', 'Delicious North Indian cuisine', 'Near Library Block', '{"monday": "09:00-20:00", "tuesday": "09:00-20:00"}'),
      ('South Canteen', 'Authentic South Indian dishes', 'Near Hostel Complex', '{"monday": "09:00-20:00", "tuesday": "09:00-20:00"}'),
      ('Fast Food Corner', 'Quick bites and beverages', 'Main Campus', '{"monday": "08:00-22:00", "tuesday": "08:00-22:00"}')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Sample categories referenced by canteen name
    await db.query(`
      INSERT INTO menu_categories (canteen_id, name, description, sort_order) VALUES
      ((SELECT id FROM canteens WHERE name = 'North Canteen'), 'Main Course', 'Full meals and curries', 1),
      ((SELECT id FROM canteens WHERE name = 'North Canteen'), 'Snacks', 'Light bites and appetizers', 2),
      ((SELECT id FROM canteens WHERE name = 'North Canteen'), 'Beverages', 'Hot and cold drinks', 3),
      ((SELECT id FROM canteens WHERE name = 'South Canteen'), 'South Indian', 'Traditional South Indian dishes', 1),
      ((SELECT id FROM canteens WHERE name = 'South Canteen'), 'Beverages', 'Filter coffee and more', 2),
      ((SELECT id FROM canteens WHERE name = 'Fast Food Corner'), 'Burgers', 'Various burger options', 1),
      ((SELECT id FROM canteens WHERE name = 'Fast Food Corner'), 'Beverages', 'Soft drinks and shakes', 2)
      ON CONFLICT (canteen_id, name) DO NOTHING;
    `);
    
    await db.query(`
      INSERT INTO menu_items (canteen_id, category_id, name, description, image_url, price, is_vegetarian, preparation_time) VALUES
      (
        (SELECT id FROM canteens WHERE name = 'North Canteen'),
        (SELECT id FROM menu_categories WHERE name = 'Main Course' AND canteen_id = (SELECT id FROM canteens WHERE name = 'North Canteen')),
        'Dal Rice', 'Traditional dal with steamed rice', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 60.00, true, 15
      ),
      (
        (SELECT id FROM canteens WHERE name = 'North Canteen'),
        (SELECT id FROM menu_categories WHERE name = 'Main Course' AND canteen_id = (SELECT id FROM canteens WHERE name = 'North Canteen')),
        'Chicken Curry', 'Spicy chicken curry with rice', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 120.00, false, 25
      ),
      (
        (SELECT id FROM canteens WHERE name = 'North Canteen'),
        (SELECT id FROM menu_categories WHERE name = 'Snacks' AND canteen_id = (SELECT id FROM canteens WHERE name = 'North Canteen')),
        'Samosa', 'Crispy samosa with chutney', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 25.00, true, 10
      ),
      (
        (SELECT id FROM canteens WHERE name = 'North Canteen'),
        (SELECT id FROM menu_categories WHERE name = 'Beverages' AND canteen_id = (SELECT id FROM canteens WHERE name = 'North Canteen')),
        'Chai', 'Indian spiced tea', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 15.00, true, 5
      ),
      (
        (SELECT id FROM canteens WHERE name = 'South Canteen'),
        (SELECT id FROM menu_categories WHERE name = 'South Indian' AND canteen_id = (SELECT id FROM canteens WHERE name = 'South Canteen')),
        'Masala Dosa', 'Crispy dosa with potato filling', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 80.00, true, 20
      ),
      (
        (SELECT id FROM canteens WHERE name = 'South Canteen'),
        (SELECT id FROM menu_categories WHERE name = 'South Indian' AND canteen_id = (SELECT id FROM canteens WHERE name = 'South Canteen')),
        'Idli Sambhar', 'Steamed idli with sambhar', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 50.00, true, 15
      ),
      (
        (SELECT id FROM canteens WHERE name = 'South Canteen'),
        (SELECT id FROM menu_categories WHERE name = 'Beverages' AND canteen_id = (SELECT id FROM canteens WHERE name = 'South Canteen')),
        'Filter Coffee', 'Traditional South Indian coffee', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 20.00, true, 5
      ),
      (
        (SELECT id FROM canteens WHERE name = 'Fast Food Corner'),
        (SELECT id FROM menu_categories WHERE name = 'Burgers' AND canteen_id = (SELECT id FROM canteens WHERE name = 'Fast Food Corner')),
        'Veg Burger', 'Vegetarian burger with fries', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 90.00, true, 15
      ),
      (
        (SELECT id FROM canteens WHERE name = 'Fast Food Corner'),
        (SELECT id FROM menu_categories WHERE name = 'Burgers' AND canteen_id = (SELECT id FROM canteens WHERE name = 'Fast Food Corner')),
        'Chicken Burger', 'Grilled chicken burger', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 130.00, false, 20
      ),
      (
        (SELECT id FROM canteens WHERE name = 'Fast Food Corner'),
        (SELECT id FROM menu_categories WHERE name = 'Beverages' AND canteen_id = (SELECT id FROM canteens WHERE name = 'Fast Food Corner')),
        'Chocolate Shake', 'Rich chocolate milkshake', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s', 60.00, true, 5
      )
      ON CONFLICT (category_id, name) DO NOTHING;
    `);

    // Set all menu item images to the provided test URL for UI testing
    await db.query(`
      UPDATE menu_items 
      SET image_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s';
    `);

      // Add canteen admin users (add this after the existing sample data)
      await db.query(`
      INSERT INTO users (email, password, first_name, last_name, role) 
      VALUES 
        ('north-admin@admin.com', $1, 'North', 'Admin', 'canteen_admin'),
        ('south-admin@admin.com', $1, 'South', 'Admin', 'canteen_admin'),
        ('fastfood-admin@admin.com', $1, 'FastFood', 'Admin', 'canteen_admin')
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);

    // Link canteen admins to their canteens
    await db.query(`
      UPDATE canteens SET admin_id = (
        SELECT id FROM users WHERE email = 'north-admin@admin.com'
      ) WHERE name = 'North Canteen';
      
      UPDATE canteens SET admin_id = (
        SELECT id FROM users WHERE email = 'south-admin@admin.com'
      ) WHERE name = 'South Canteen';
      
      UPDATE canteens SET admin_id = (
        SELECT id FROM users WHERE email = 'fastfood-admin@admin.com'
      ) WHERE name = 'Fast Food Corner';
    `);

    console.log('Canteen admin login credentials:');
    console.log('North Canteen: north-admin@admin.com / password');
    console.log('South Canteen: south-admin@admin.com / password');
    console.log('Fast Food: fastfood-admin@admin.com / password');
    
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
