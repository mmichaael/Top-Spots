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
        if(err)console.log(`Problem with Database connnection: ${err}`)
            else console.log(`Successful connection to Database`)
    })
}
checkDatabaseConnection();
module.exports = pool