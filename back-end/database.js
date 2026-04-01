const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, './privateInf.env') });
const { Pool } = require('pg');
const fs = require('fs');
console.log(process.env.DATABASE_URL)


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
         rejectUnauthorized: false 
    }
});

async function checkDatabaseConnection() {
    pool.connect((err)=>{
        if(err){
            console.log(`Problem with Database connnection: ${err}`);
        } else {
            console.log(`Successful connection to Database`);
            pool.query(`
                CREATE TABLE IF NOT EXISTS "SearchStats" (
                    search_stat_id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES "Users" (user_id) ON DELETE CASCADE,
                    query_text TEXT NOT NULL,
                    category VARCHAR(150),
                    source VARCHAR(50) DEFAULT 'unknown',
                    results_count INT DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `).catch(e => console.error('SearchStats table creation failed', e));
        }
    })
}
checkDatabaseConnection();
module.exports = pool