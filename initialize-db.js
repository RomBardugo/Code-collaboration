// initialize-db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dbFile = 'database.db';
const schemaFile = 'schema.sql';

console.log('Checking if the database file exists...');

// Check if the database file exists
if (!fs.existsSync(dbFile)) {
  console.log('Database file does not exist. Creating a new database...');

  // Create a new database file
  const db = new sqlite3.Database(dbFile);

  // Read and execute the schema SQL commands
  const schema = fs.readFileSync(schemaFile, 'utf8');
  
  console.log('Executing schema SQL commands...');

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing the database:', err.message);
    } else {
      console.log('Database initialized successfully.');
    }

    // Close the database connection
    db.close();
  });
} else {
  console.log('Database already exists. No need to initialize.');
}
