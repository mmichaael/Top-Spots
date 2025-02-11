const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const pool = require('./database') 



class Controller {

    pageMain = path.join(__dirname, '../Front-end/html/index.html') 
    pageError = path.join(__dirname, '../front-end/html/error.html')
    pageAuth = path.join(__dirname, '../front-end/html/authentication.html')


    //Open Main page
    openMainPage = (req, res)=>{
        try{
            res.sendFile(this.pageMain,(err)=>{
                if(err){
                    console.log(`Problem with sending Main page: ${err}`)
                    return res.status(404).json()
                }
                console.log(`Main page successfully opened`)
                res.status(200)      
            })
        }catch(err){
            console.log(`Problem with server or bad request: ${err}`)
            res.status(500).json()
        }
    }

    //Open Error page
    openErrorPage = (req, res)=>{
        try{
            res.sendFile(this.pageError, (err)=>{
                if(err){
                    console.log(`Problem with sending Error page: ${err}`)
                    return res.status(400).json()           
                }
                console.log(`Error page ssuccessful opened`)
                res.status(200)         
            })
        }catch(err){
            console.log(`Problem with server or bad request: ${err}`)
            res.status(500).json()
        }
    }

    //Open Auth page
    openAuthPage = (req, res)=>{
        try{
            res.sendFile(this.pageAuth, (err)=>{
                if(err){
                    console.log(`Problem with sending Auth page: ${err}`)
                    return res.status(400).json()
                }
                console.log(`Auth page ssuccessful opened`)
                res.status(200)
            })
        }catch(err){
            console.log(`Problem with server or bad request: ${err}`)
            res.status(500).json()
        }
    }


    //Registration
    signUp = async (req, res) =>{
        const{username, email, password}=req.body
        const saltLvl=10

        if (!username || !email || !password) {
            console.log(`Username, Login and password are required`)
            return res.status(400).json();
        }
        const existUser = await pool.query(`SELECT * FROM "Users" WHERE email = ($1)`,[email])
        if(existUser.rowCount>0){
            console.log(`User with this email or phone number ${existUser.rows[0].email} are already exist,`)
            return res.status(409).json()
        }
        try{
            const hashedPassword = await bcrypt.hash(password, saltLvl)
            console.log(`Hashed password: ${hashedPassword}`)

            const creatingUser = await pool.query(`INSERT INTO "Users" (username, email, password) VALUES ($1, $2, $3) RETURNING user_id`,[username, email, hashedPassword])
            if(creatingUser.rowCount===0){
                console.log(`Problem with creating user in Database`)
                res.status(400).json()
                return
            }
            res.status(201).json()
        }catch(err){
            console.log(`Problem with server`)
            res.status(500).json()  
        }
    }

    //Log in 
    logIn = async (req, res)=>{
        const{email, password}=req.body
        if(!email || !password){
            console.log(`User have not entered login or password`)
            return res.status(400).json()
        }
        try{
            const dataBaseUserInf = await pool.query(`SELECT * FROM "Users" WHERE email = ($1)`,[email])
            if(dataBaseUserInf.rowCount===0){
                console.log(`User with this email ${email} is not exist`)
                return res.status(401).json()
            }
            const user = dataBaseUserInf.rows[0]
            const IsMatchPassword = await bcrypt.compare(password, user.password)
            if(!IsMatchPassword){
                console.log(`User have entered wrong password`)
                return res.status(401).json()
            }
            console.log(`User with this email ${email} successfully logged in`)
            return res.status(200).json()

        }catch(err){
            console.log(`Problem with server, cause: ${err}`)
            return res.status(500).json()
        }
    }
}

module.exports = Controller