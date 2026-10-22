const mysql = require('mysql2/promise');

const config = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2sDpLXRqpaVzhbL.root',
  password: 'ruF8aUKWTl5Qy4Un',
  database: 'sys', // Kailangan muna natin pumasok sa sys para makagawa ng bagong DB
  ssl: { rejectUnauthorized: false },
  multipleStatements: true
};

const schema = `
-- 1. Gumawa muna tayo ng sarili nating database
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- 2. Tapos, gawin na natin yung mga tables
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student') NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS teachers (
  id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL, teacher_id VARCHAR(50) NOT NULL,
  department VARCHAR(150), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT, student_id VARCHAR(20) NOT NULL, full_name VARCHAR(100) NOT NULL,
  year_level VARCHAR(20) NOT NULL, section VARCHAR(50) NOT NULL, email VARCHAR(100), user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS classes (
  id INT PRIMARY KEY AUTO_INCREMENT, teacher_id INT NOT NULL, class_code VARCHAR(50) UNIQUE NOT NULL,
  class_name VARCHAR(150) NOT NULL, year_level VARCHAR(50) NOT NULL, section VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT, teacher_id INT NOT NULL, class_id INT NOT NULL,
  subject_code VARCHAR(50) NOT NULL, subject_name VARCHAR(150) NOT NULL, enrollment_code VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS student_subjects (
  id INT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL, subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_student_subject (student_id, subject_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT, teacher_id INT NOT NULL, attendance_date DATE NOT NULL,
  start_time TIME NOT NULL, end_time TIME NOT NULL, code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL, active TINYINT(1) DEFAULT 1, class_id INT, subject_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL, subject_id INT, date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL, time_in TIME, remarks VARCHAR(255), session_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_student_date_subject (student_id, date, subject_id)
);
`;

async function setup() {
  let connection;
  try {
    console.log('🔄 Connecting to TiDB...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected!');
    console.log('🔄 Creating database and tables...');
    await connection.query(schema);
    console.log('✅ Database and Tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}
setup();