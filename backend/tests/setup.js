import dotenv from 'dotenv';

// Makes TEST_DATABASE_URL from backend/.env available to the tests.
dotenv.config({ quiet: true });
process.env.NODE_ENV = 'test';
