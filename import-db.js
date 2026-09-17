const fs = require('fs');
const mysql = require('mysql2/promise');

async function importDatabase() {
  const connection = await mysql.createConnection({
    host: 'turntable.proxy.rlwy.net',
    port: 13669,
    user: 'root',
    password: 'XnZNFqIgbxgKqJtDTTUEnwlUVvqxvDSK',
    database: 'railway',
    multipleStatements: true
  });

  let sql = fs.readFileSync('./backup.sql', 'utf16le');
  sql = sql.replace(/^\uFEFF/, '');

  await connection.query(sql);
  console.log('Database imported successfully!');
  await connection.end();
}

importDatabase().catch(err => console.error('Import failed:', err));