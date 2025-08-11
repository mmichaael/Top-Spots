const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const pool = require('./database');
const passport = require('passport');
const { default: axios } = require('axios');
 require('dotenv').config({ path: path.resolve(__dirname, './privateInf.env') });

class Controller {
    pageBaseMain = path.join(__dirname, '../Front-end/html/index.html');
    pageFullMain = path.join(__dirname, '../Front-end/html/logged_index.html');
    pageError = path.join(__dirname, '../front-end/html/error.html');
    pageAuth = path.join(__dirname, '../front-end/html/authentication.html');
    pageEmailConfirmation = path.join(
        __dirname,
        '../front-end/html/email_confirmation.html',
    );
    pageResetPasswordEnterPage = path.join(

        __dirname,
        '../front-end/html/reset_password.html',
    );

    //Open Main page
    openBaseMainPage = (req, res) => {
        try {
            res.sendFile(this.pageBaseMain, (err) => {
                if (err) {
                    console.log(`Problem with sending Main page: ${err}`);
                    return res.status(404).json();
                }
                console.log(`Main page successfully opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    openFullMainPage = (req, res) => {
        try {
            res.sendFile(this.pageFullMain, (err) => {
                if (err) {
                    console.log(`Problem with sending New Main page: ${err}`);
                    return res.status(404).json();
                }
                console.log(`New Main page successfully opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Error page
    openErrorPage = (req, res) => {
        try {
            res.sendFile(this.pageError, (err) => {
                if (err) {
                    console.log(`Problem with sending Error page: ${err}`);
                    return res.status(400).json();
                }
                console.log(`Error page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Auth page
    openAuthPage = (req, res) => {
        try {
            res.sendFile(this.pageAuth, (err) => {
                if (err) {
                    console.log(`Problem with sending Auth page: ${err}`);
                    return res.status(400).json();
                }
                console.log(`Auth page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Reset Password Enter Page
    openResetPasswordEnterPage = (req, res) => {
        try {
            res.sendFile(this.pageResetPasswordEnterPage, (err) => {
                if (err) {
                    console.log(
                        `Problem with sending Reset Password Enter page: ${err}`,
                    );
                    return res.status(400).json();
                }
                console.log(`Reset Password Enter page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Email Confirmation page
    openEmailConfirmation = (req, res) => {
        try {
            res.sendFile(this.pageEmailConfirmation, (err) => {
                if (err) {
                    console.log(
                        `Problem with sending Email Confirmation page: ${err}`,
                    );
                    return res.status(400).json();
                }
                console.log(`Email Confirmation page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    // Creating JWT Token and sending to Data BASE
    creatingJwtAccRefTokens = async (username, email, remember) => {
        try {
            const accessTokenPayload = {
                username,
                email,
                iat: Math.floor(Date.now() / 1000), // Time when Token was created
                exp: Math.floor(Date.now() / 1000) + 7 * 60, // Time when Token will unvalid
            };
            const refreshTokenPayload = {
                username,
                email,
                iat: Math.floor(Date.now() / 1000), // Time when Token was created
                exp: remember
                    ? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
                    : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Time when Token will unvalid
            };
            const accessToken = jwt.sign(
                accessTokenPayload,
                process.env.ACCESSJWTTOKEN,
            );
            const refreshToken = jwt.sign(
                refreshTokenPayload,
                process.env.REFRESHJWTTOKEN,
            );
            const saveToken = await pool.query(
                `
                    INSERT INTO "JWTRefreshToken" (refresh_token) 
                    VALUES ($1) 
                    ON CONFLICT (refresh_token) 
                    DO UPDATE SET refresh_token = EXCLUDED.refresh_token 
                    RETURNING reftoken_id`,
                [refreshToken],
            );
            if (saveToken.rowCount === 0) {
                console.log(`Refresh Token have not saved in Database`);
                return { refreshToken: null, accessToken: null };
            }
            const refTokenId = saveToken.rows[0].reftoken_id;
            const updateRefToken = await pool.query(
                `UPDATE "Users" SET reftoken_id = $1 WHERE email = $2 RETURNING user_id`,
                [refTokenId, email],
            );
            if (updateRefToken.rowCount === 0) {
                return console.log(
                    `Refresh Token have not updated in Users table`,
                );
            }
            console.log(`Refresh Token is saved in Database`);
            return { refreshToken, accessToken };
        } catch (err) {
            console.log(`Error with creating JWT tokens: ${err}`);
            return;
        }
    };

    //Sending Email
    sendingEmail = async (to, subject, htmlEmailContent) => {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAILSENDER, //  My Email
                    pass: process.env.GOOGLEAPPPASSWORD, //  Google App Password
                },
            });

            const emailOptions = {
                from: process.env.EMAILSENDER,
                to,
                subject,
                html: htmlEmailContent,
            };

            const sending = await transporter.sendMail(emailOptions);
            console.log(`Email sent: ${sending.response}`);
        } catch (err) {
            console.log(`Error sending email: ${err}`);
        }
    };
    // Email Letter Html content
    emailLetterContent = (username, token) => {
        return `
             <div style="width: 100%; height: 100%;">
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="width: 100%;">
                <tr align="center" style="background-color: #000;">
                    <td>
                       <div style="width: 25%; height: 20%;">
                           <img src="https://imgur.com/r43Fdc9.png" alt="" style="width: 100%; height: 100%;">
                        </div>
                    </td>
                </tr>
                 <tr >
                    <td style="padding: 0px 5% 8% 5%; color: #000;" >
                       <table> 
                             <tr align="center" style="font-size: 25px">
                                <td>
                                   <h2>Email Confirmation</h2>
                                </td>
                             </tr>
                             <tr>
                                <td >
                                   <p style="font-size: 18px; letter-spacing: 1.5px; color: #000;">Hi <span style="color:rgb(22, 0, 80);" font-size: 18px;>${username}</span>, <br> <span style="font-size: 20px; letter-spacing: 1.5px; color: #000;">you're almost set to start enjoying our service. Simply click the link below to verify your email address and get started. The link expires in 24 hours.</span></p>
                                </td>
                             </tr>
                             <tr align="center">
                                <td style="padding: 15px 0px;">
                                   <a href="http://localhost:3500/api/verify-email?token=${token}"  style="background: linear-gradient(to right,rgb(19, 19, 19),rgb(12, 66, 165)); padding: 2.5% 4.5%; border-radius: 10px; letter-spacing: 2px; color:#eeeeee; font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif; font-size: 20px; font-weight: 550; text-decoration: none;">Verify my Email</a>
                                </td>
                             </tr>
                             <tr>
                                <td style="padding-top: 10px;">
                                <p style="font-size: 16px; letter-spacing: 1.5px; font-weight: 500;">If you did not request this email verification, please ignore this message. No further action is required.</p>
                                </td>
                             </tr>
                             <tr align="center">
                                <td align="center" style="font-size: 14px; color: #666; padding-top: 40px;">
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                                    <tr>
                                       <td width="40%">
                                       <div style="width: 100%; height: 3px; background: linear-gradient(to left,rgb(156, 154, 154),rgb(255, 255, 255));"></div>
                                       </td>
                                       <td align="center" style="width: 20%; font-weight: 500; font-size: 18px; color: #000; letter-spacing: 2px; padding: 0 5px; white-space: nowrap;">Social Media</td>
                                       <td width="40%">
                                       <div style="width: 100%; height: 3px; background: linear-gradient(to right,rgb(156, 154, 154),rgb(255, 255, 255));"></div>
                                       </td>
                                    </tr>
                                  </table>
                                </td>
                             </tr>
                            <tr align="center">
                              <td style="padding-top: 10px;">
                                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                                    <tr>
                                       <td align="center" width="10%" style="text-align: right;">
                                          <a href="https://www.facebook.com/" target="_blank" >
                                            <img src="https://imgur.com/3LjMEoc.png" alt="Facebook" width="25" height="25" style="display: block;  border-radius: 45px; margin-left: auto;">
                                          </a>
                                       </td>
                                       <td align="center" width="10%">
                                         <a href="https://www.youtube.com/" target="_blank">
                                           <img src="https://imgur.com/PATYsSx.png" alt="YouTube" width="25" height="25" style="display: block;  border-radius: 45px;">
                                         </a>
                                       </td>
                                       <td align="center" width="10%" style="text-align: left;">
                                         <a href="https://www.instagram.com/" target="_blank">
                                           <img src="https://imgur.com/NqwvKkM.png" alt="Tik Tok" width="25" height="25" style="display: block; border-radius: 45px; margin-right: auto;">
                                         </a>
                                       </td>
                                    </tr>
                                 </table>
                              </td>
                            </tr>
                            <tr>
                               <td align="center">
                                  <p style="font-size: 16px; letter-spacing: 1px; color: #000;">Follow our social media for updates and great offers</p>
                               </td>
                            </tr>
                             <tr>
                               <td align="center" style="background-color: #000; padding: 10px 10px;">
                                  <p style="font-size: 15px; letter-spacing: 1px; color: #fff; font-weight: 600; margin: 0px;">Top Spots</p>
                                  <p style="font-size: 12px; letter-spacing: 1px; color: rgb(230, 188, 4); margin: 0px;">Discover The best Around You</p>
                               </td>
                            </tr>
                       </table>
                    </td>
                 </tr>
              </table>`;
    };
    //Email Varification
    emailVerify = async (req, res) => {
        try {
            const { token } = req.query;
            if (!token) {
                console.log(`EVToken is failed, can't to verify email`);
                return;
            }
            const checkToken = await pool.query(
                `SELECT evtoken_id FROM "EVToken" where ev_token = $1`,
                [token],
            );
            if (checkToken.rowCount === 0) {
                console.log(
                    `Database has no this token, so wew can't confirm email`,
                );
                return;
            }
            const chekedTokenId = checkToken.rows[0].evtoken_id;
            console.log(`Token id: ${chekedTokenId}`);

            const isVerified = await pool.query(
                `UPDATE "Users" SET is_verified = true WHERE evtoken_id = $1 RETURNING is_verified, email, username, remember_me`,
                [chekedTokenId],
            );
            if (isVerified.rowCount === 0) {
                console.log(`Problem with updating isVerified`);
                return;
            }
            const verificationStatus = isVerified.rows[0].is_verified;
            console.log(
                `Verification is completed, is Verified = ${verificationStatus}`,
            );

            const username = isVerified.rows[0].username;
            const email = isVerified.rows[0].email;
            const remember = isVerified.rows[0].remember_me;

            const { refreshToken, accessToken } =
                await this.creatingJwtAccRefTokens(username, email, remember);
            if (!refreshToken || !accessToken) {
                console.log(`Error: JWT tokens were not created properly`);
                return res
                    .status(500)
                    .json({ error: 'JWT token generation failed' });
            }
            this.createCookies(res, refreshToken, accessToken);

            // res.status(200).json({accessToken})
            res.redirect('/email-confirmition');
        } catch (err) {
            console.log(
                `Problem with confirmation EVtoken or updating isVerified: ${err}`,
            );
            res.status(500).json();
        }
    };
    // Resent email btn
    resentEmail = async (req, res) => {
        const { email } = req.body;
        if (!email) {
            console.log(`Email are required`);
            return res.status(400).json();
        }
        const userInf = await pool.query(
            `SELECT username, evtoken_id FROM "Users" WHERE email = $1`,
            [email],
        );
        if (userInf.rowCount === 0) {
            console.log(`We have not this email in database`);
            return;
        }
        const username = userInf.rows[0].username;
        const tokenId = userInf.rows[0].evtoken_id;
        const evtokenInf = await pool.query(
            `SELECT ev_token FROM "EVToken" WHERE evtoken_id = $1`,
            [tokenId],
        );
        if (evtokenInf.rowCount === 0) {
            console.log(`We have not found evtoken in database`);
            return;
        }
        const EmailVereficationToken = evtokenInf.rows[0].ev_token;

        const emailContent = this.emailLetterContent(
            username,
            EmailVereficationToken,
        );
        await this.sendingEmail(email, 'Email Confirmation', emailContent);
        res.status(201).json({ createdEmail: email });
    };

    //Registration
    signUp = async (req, res) => {
        const { username, email, password, remember } = req.body;
        const saltLvl = 10;

        if (!username || !email || !password) {
            console.log(`Username, Login and password are required`);
            return res.status(400).json();
        }
        const existUser = await pool.query(
            `SELECT * FROM "Users" WHERE email = ($1)`,
            [email],
        );
        if (existUser.rowCount > 0) {
            console.log(
                `User with this email or phone number ${existUser.rows[0].email} are already exist`,
            );
            return res.status(409).json({ createdEmail: 'error@gmail.com' });
        }
        try {
            const hashedPassword = await bcrypt.hash(password, saltLvl);
            console.log(`Hashed password: ${hashedPassword}`);

            //Creating Email Verification Token
            const EmailVereficationToken = crypto
                .randomBytes(32)
                .toString('hex');
            const creatingEVToken = await pool.query(
                'INSERT INTO "EVToken" (ev_token) VALUES ($1) RETURNING evtoken_id',
                [EmailVereficationToken],
            );
            const EVToken = creatingEVToken.rows[0]?.evtoken_id || null;
            if (!EVToken) {
                console.log('Error creating evtoken');
                res.status(500).json();
                return;
            }
            const provider = 'local';
            //Creating/Sending User and EVToken in database
            const creatingUser = await pool.query(
                `INSERT INTO "Users" (username, email, password, evtoken_id, remember_me, provider) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
                [username, email, hashedPassword, EVToken, remember, provider],
            );
            if (creatingUser.rowCount === 0) {
                console.log(
                    `Problem with creating user or evtoken in Database`,
                );
                res.status(400).json();
                return;
            }
            //Sending Email Confirmation
            const emailContent = this.emailLetterContent(
                username,
                EmailVereficationToken,
            );
            await this.sendingEmail(email, 'Email Confirmation', emailContent);
            res.status(201).json({ createdEmail: email });
        } catch (err) {
            console.log(`Problem with server, ${err}`);
            res.status(500).json();
        }
    };
    //Log in
    logIn = async (req, res, next) => {
        const { email, password, remember } = req.body;
        if (!email || !password) {
            console.log(`User have not entered login or password`);
            return res.status(400).json();
        }
        try {
            const dataBaseUserInf = await pool.query(
                `SELECT * FROM "Users" WHERE email = ($1)`,
                [email],
            );
            if (dataBaseUserInf.rowCount === 0) {
                console.log(`User with this email ${email} is not exist`);
                return res.status(401).json();
            }
            const user = dataBaseUserInf.rows[0];
            const IsMatchPassword = await bcrypt.compare(
                password,
                user.password,
            );
            if (!IsMatchPassword) {
                console.log(`User have entered wrong password`);
                return res.status(401).json();
            }

            if (remember) {
                const savingRemember = await pool.query(
                    `UPDATE "Users" SET remember_me = $1 WHERE email = $2 RETURNING username`,
                    [remember, user.email],
                );
                if (savingRemember.rowCount === 0) {
                    return console.log(`Saving Remember Me in DB is is failed`);
                }
            }

            const { refreshToken, accessToken } =
                await this.creatingJwtAccRefTokens(
                    user.username,
                    user.email,
                    remember,
                );
            if (!refreshToken || !accessToken) {
                console.log(`Error: JWT tokens were not created properly`);
                return res
                    .status(500)
                    .json({ error: 'JWT token generation failed' });
            }

            this.createCookies(res, refreshToken, accessToken);

            console.log(`User with this email ${email} successfully logged in`);
            res.status(200).json({ redirectUrl: '/new-main' });
        } catch (err) {
            console.log(`Problem with server, cause: ${err}`);
            return res.status(500).json();
        }
    };
    //Clear Cookies
    clearCookies = (res) => {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            // maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            // maxAge: 2 * 60 * 1000,
        });
    };
    //Create Cookies
    createCookies = (res, refreshToken, accessToken) => {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, // Defend from XSS
            secure: false, // Only  HTTPS
            sameSite: 'Lax', // Defend from CSRF
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true, // Defend from XSS
            secure: false, // Only  HTTPS
            sameSite: 'Lax', // Defend from CSRF
        });
    };
    //Log Out
    //!---------------------------------------------------------------------------------------------------------------------
    logOut = async (req, res) => {
        console.log(`Log out is working`);
        try {
            const refreshToken = req.cookies.refreshToken;
            console.log(`Received refreshToken:`, refreshToken); // Лог значення
            if (!refreshToken) {
                console.log('No refresh token found in cookies');
                this.clearCookies(res);
                return res.redirect('/checkUser');
            }
            const response = await pool.query(
                `UPDATE "JWTRefreshToken" 
                    SET refresh_token = NULL
                    WHERE refresh_token = $1 
                    RETURNING *`,
                [refreshToken],
            );
            if (response.rowCount > 0) {
                console.log(`Refresh Token is deleted from Database`);
            } else {
                console.log(`Refresh Token is not deleted from Database`);
            }
            this.clearCookies(res);
            console.log(`Redirecting user to checkUser`);
            return res.status(200).json({ redirectUrl: '/checkUser' });
        } catch (err) {
            console.error(`Logout process failed:${err}`);
            return res
                .status(500)
                .json({ message: 'Internal server error during logout' });
        }
    };

    //Middleware to check Validity Access and Refresh Tokens
    checkValidityAccessToken = async (req, res, next) => {
        try {
            const accessToken = req.cookies.accessToken;
            // if (!accessToken) {
            //     console.log(`Access token is not defined`);
            //     return res
            //         .status(401)
            //         .json({ message: 'Access token missing'});
            // }
            jwt.verify(
                accessToken,
                process.env.ACCESSJWTTOKEN,
                (err, decoded) => {
                    if (err) {
                        console.log(`The Access Token is not valid`);
                        return this.refreshAccessToken(req, res, next);
                    }
                    const { username, email } = decoded;
                    req.username = username;
                    req.email = email;
                    console.log(`The Access Token is valid`);
                    next();
                },
            );
        } catch (err) {
            console.log(
                `Problem with cheking validity of access token: ${err.message}`,
            );
            res.status(500).json();
        }
    };

    //Refresh Access and Refresh tokens
    refreshAccessToken = async (req, res, next) => {
        try {
            //Get Refresh Token from Cookies
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                console.log(`Refresh token is missing in cookies`);
                this.clearCookies(res);
                return res.redirect('/checkUser');
            }
            // Decoding Token to get Info about User
            let decodedRefreshToken;
            try {
                decodedRefreshToken = jwt.verify(
                    refreshToken,
                    process.env.REFRESHJWTTOKEN,
                );
            } catch (err) {
                console.log(`Decoding users refresh token is failed: ${err}`);
                const response = await pool.query(
                    `UPDATE "JWTRefreshToken" 
                    SET refresh_token = NULL
                    WHERE refresh_token = $1 
                    RETURNING *`,
                    [refreshToken],
                );
                if (response.rowCount > 0) {
                    console.log(`Refresh Token is deleted from Database`);
                } else {
                    console.log(`Refresh Token is not deleted from Database`);
                }
                this.clearCookies(res);
                return res.redirect('/checkUser');
            }
            const { username, email } = decodedRefreshToken;
            console.log(
                `Refresh token decoded successfully for user: ${username}, email: ${email}`,
            );

            //Check if this RefreshToken exists in the Database
            const checkTokenPayload = await pool.query(
                `
            SELECT jt.reftoken_id 
            FROM "JWTRefreshToken" jt 
            JOIN "Users" u 
            ON U.reftoken_id = jt.reftoken_id 
            WHERE u.email = $1 AND jt.refresh_token = $2`,
                [email, refreshToken],
            );

            //If Refresh Token is not in database or invalid, we redirect to login
            if (checkTokenPayload.rowCount === 0) {
                console.log(
                    `Invalid or expired refresh token for user: ${username}, email: ${email}`,
                );
                return res.redirect('/checkUser');
            }

            //Creating ans sending Access Token to user
            const accessToken = jwt.sign(
                {
                    username,
                    email,
                    iat: Math.floor(Date.now() / 1000), // Time when Token was created
                    exp: Math.floor(Date.now() / 1000) + 7 * 60, // Time when Token will unvalid
                },
                process.env.ACCESSJWTTOKEN,
            );
            console.log(
                `New Access Token: ${accessToken} generated for user: ${username}, email: ${email}`,
            );
            res.cookie('accessToken', accessToken, {
                httpOnly: true, // Defend from XSS
                secure: false, // Only  HTTPS
                sameSite: 'Strict', // Defend from CSRFDFF
                // maxAge: 2 * 60 * 1000, // Alive time
            });
            req.cookies.accessToken = accessToken;
            await this.checkValidityAccessToken(req, res, next);
            res.status(200);
            // res.status(200).json({ message: 'Access token refreshed' });
        } catch (err) {
            console.error(
                `Problem with Refreshing Access or Refresh Tokens: ${err.message}`,
            );
            res.status(500).json({
                message: 'Problem with Refreshing Tokens',
                error: err.message,
            });
        }
        
    };
    //Reset Passwordd Email HTML Content
    resentPasswordEmailContent = (username, reset_code) => {
        return `
     <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0;">
     <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="width: 100%;">
                <tr align="center" style="background-color: #000;">
                    <td>
                       <div style="width: 25%; height: 20%;">
                           <img src="https://imgur.com/r43Fdc9.png" alt="" style="width: 100%; height: 100%;">
                        </div>
                    </td>
                </tr>
            </table>
     <div class="container" style="max-width: 600px; margin: 20px auto; background-color:rgb(255, 255, 255); padding: 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); color: #333333;">
     <div class="header" style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
     <h1 style="margin: 0; color: #2c3e50;">Password Change Request</h1>
    </div>
    <div class="content" style="line-height: 1.6; font-size: 14px;">
      <p style="font-size: 16px; color:rgb(0, 0, 0); ">Hello <span style="color: #003366;">${username}</span>,</p>
      <p style="font-size: 16px; color:rgb(0, 0, 0);">We received a request to reset the password for your account.</p>
      <p style="font-size: 16px; color:rgb(0, 0, 0);">If this was you — great! Use the code below to proceed:</p>

      <div class="reset-code" style="font-size: 24px;
      font-weight: bold;
      background-color: #F4F4F4;
      padding: 12px 20px;
      text-align: center;
      border-radius: 8px;
      margin: 20px 0;
      color: #003366;
      letter-spacing: 3px;">${reset_code}</div>

      <p style="color:rgb(0, 0, 0);">This code is valid for a limited time and should be used only once.</p>

      <p style="color:rgb(0, 0, 0);">To continue resetting your password, click the button below:</p>
      <div style="text-align: center;" >
      <a class="button" style="display: inline-block;
      padding: 14px 24px;
      background-color: #005288;
      color: white;
      leter-spacing: 1.2 px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;" href="http://localhost:3500/api/resetPasword/OpenEnterPage">Reset My Password</a>
      </div>   
      
      <p style="color:rgb(0, 0, 0);">If the button doesn’t work, copy and paste the following link into your browser:</p>
      <p class="link" style="word-break: break-word;
      color: #005288;">http://localhost:3500/api/resetPasword/OpenEnterPage</p>

      <p style="color:rgb(0, 0, 0);">If you did not request this change, please ignore this message. Your account remains secure.</p>

      <p style="color:rgb(0, 0, 0);">Need help? Contact our support team — we’re here for you!</p>

      <p style="color:rgb(0, 0, 0);">Best regards,<br><strong>Top Spots Team</strong></p>
    </div>
    <div class="footer" style="font-size: 13px;
      color: #888888;
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
      text-align: center;">
      <p style="color:rgb(114, 114, 114);">This email was sent by Top Spots. If you didn’t request a password change, no further action is needed.</p>
    </div>
  </div>
</body>
      `;
    };

    //Reset Password Sending Email to User
    resetPasswordSentEmail = async (req, res) => {
        const { resentPasswordEmail } = req.body;
        if (!resentPasswordEmail) {
            console.log(`Email is required`);
            return res.status(400).json({ message: 'Email is required' });
        }

        function generateSecureCode() {
            return crypto.randomInt(100000, 1000000).toString();
        }

        try {
            const userInf = await pool.query(
                `SELECT * FROM "Users" WHERE email = $1`,
                [resentPasswordEmail],
            );

            if (userInf.rowCount === 0) {
                console.log(`User with this email is not found`);
                return res.status(200).json({ message: 'User not found' });
            }

            const codeForEmail = generateSecureCode();
            const expiresTime = new Date(Date.now() + 1.5 * 60 * 1000);
            console.log(`Generated code for email: ${codeForEmail}`);

            const saveInf = await pool.query(
                `WITH upsert AS (
         INSERT INTO "ResetPassword" (reset_code, expires_time)
         VALUES ($1, $3)
         ON CONFLICT (reset_code) DO UPDATE
         SET reset_code = EXCLUDED.reset_code, expires_time = EXCLUDED.expires_time
         RETURNING reset_password_id)
         
         UPDATE "Users"
         SET reset_password_id = (SELECT reset_password_id FROM upsert LIMIT 1)
         WHERE email = $2 RETURNING username`,
                [codeForEmail, resentPasswordEmail, expiresTime],
            );

            if (saveInf.rowCount === 0) {
                console.log(`Saving reset code in Data Base failed`);
                return res
                    .status(400)
                    .json({ message: 'Failed to save reset code' });
            }

            const username = saveInf.rows[0].username;
            const emailContent = this.resentPasswordEmailContent(
                username,
                codeForEmail,
            );
            await this.sendingEmail(
                resentPasswordEmail,
                'Reset Password',
                emailContent,
            );

            console.log(`Reset email successfully sent`);

            return res.status(200).json({ message: 'Email sent successfully' });
        } catch (err) {
            console.log(
                `Problem with Reset Password Sending Email: ${err.message}`,
            );
            res.status(500).json({
                message: 'Problem with Reset Password Sending Email',
                error: err.message,
            });
        }
    };

    //Reset Password Check Validity of Verification Code
    checkVerificationCode = async (req, res) => {
        const { resetCode } = req.body;
        if (!resetCode) {
            console.log(
                `Check Verification Code Function didn't receive any data`,
            );
            return res.status(400).json();
        }

        const codeFromDatabase = await pool.query(
            `SELECT * FROM "ResetPassword" WHERE reset_code = ($1)`,
            [resetCode],
        );
        if (codeFromDatabase.rowCount == 0) {
            console.log(`Code is Not verificated, user can't change password`);
            return res.status(404).json();
        }
        const expiresTime = codeFromDatabase.rows[0].expires_time;
        if (Date.now() > new Date(expiresTime).getTime()) {
            console.log(`Reset code has expired`);
            const deleteResetCode = await pool.query(
                `DELETE FROM "ResetPassword" WHERE reset_code = $1`,
                [resetCode],
            );
            if (deleteResetCode.rowCount == 0)
                console.log(`Deleting expired reset code was failed`);
            return res.status(410).json();
        }

        console.log(`Code is verificated, user can change password`);
        return res.status(200).json();
    };

    //Reset Password Creating new Password
    creatingNewPassword = async (req, res) => {
        const { newPassword01, resetCode } = req.body;
        const saltLvl = 10;

        if (!newPassword01 || !resetCode) {
            console.log(
                `Creating New Password havn't recive new password or reset code`,
            );
            return res.status(403).json();
        }
        try {
            const resetPasswordId = await pool.query(
                `SELECT reset_password_id FROM "ResetPassword" WHERE reset_code = $1`,
                [resetCode],
            );
            if (resetPasswordId.rowCount == 0) {
                console.log(`User not found for updating password`);
                return res.status(404).json();
            }
            const resetPasswordCodeId =
                resetPasswordId.rows[0].reset_password_id;
            const hashedPassword = await bcrypt.hash(newPassword01, saltLvl);
            const updatingPassword = await pool.query(
                `UPDATE "Users" SET password = $1 WHERE reset_password_id = $2 RETURNING user_id`,
                [hashedPassword, resetPasswordCodeId],
            );
            if (updatingPassword.rowCount == 0) {
                console.log(`Updating new Password in database was failed`);
                return res.status(404).json();
            }

            console.log(`New Password is updated`);
            res.status(200).json();
            return;
        } catch (err) {
            console.log(`Problem with server, cause: ${err.message}`);
            return res.status(500).json();
        }
    };

    //Reset Password Deleting Reset Code
    deletingResetCode = async (req, res) => {
        const code = req.body.resetCode;

        const deleteResetCode = await pool.query(
            `DELETE FROM "ResetPassword" WHERE reset_code = $1`,
            [code],
        );
        if (deleteResetCode.rowCount == 0) {
            console.log(`Deleting expired reset code was failed`);
            return res.status(200).json({ redirectTo: '/checkUser' });
        }
        console.log(`Deleting expired reset code was successful`);
        return res.status(200).json({ redirectTo: '/checkUser' });
    };

    //Authentification with Google, Send user to Google
    openGoogleAuth = () => {
        return passport.authenticate('google', { scope: ['profile', 'email'] });
    };

    //Authentification with Google, Get user from Google
    getGoogleDataAuth = (req, res, next) => {
        passport.authenticate(
            'google',
            { session: false, failureRedirect: '/checkUser' },
            async (err, user, info) => {
                if (err | !user) return res.redirect('/checkUser');
                const { id: googleId, displayName: name, emails } = user;
                const email = emails?.[0]?.value;
                const provider = 'google';
                const rememberMe = true;
                const isVerified = true;

                const searchForGoogleId = await pool.query(
                    `SELECT * FROM "Users" WHERE google_id = $1`,
                    [googleId],
                );
                if (searchForGoogleId.rowCount > 0) {
                    const { refreshToken, accessToken } =
                        await this.creatingJwtAccRefTokens(
                            name,
                            email,
                            rememberMe,
                        );
                    if (!refreshToken || !accessToken) {
                        console.log(
                            `Error: JWT tokens were not created properly in searchForGoogleId function`,
                        );
                        return res.redirect('/checkUser');
                    }
                    this.createCookies(res, refreshToken, accessToken);
                    console.log(`User logged in via Google`);
                    return res.redirect('/new-main');
                }

                const searchForEmail = await pool.query(
                    `SELECT * FROM "Users" WHERE email = $1`,
                    [email],
                );
                if (searchForEmail.rowCount > 0) {
                    const changeUserDataInDb = await pool.query(
                        `UPDATE "Users" SET google_id = $1 WHERE email = $2 RETURNING user_id`,
                        [googleId, email],
                    );
                    if (changeUserDataInDb.rowCount == 0) {
                        console.log(
                            `Changing users data in searching user via email was failed`,
                        );
                        return res.redirect('/checkUser');
                    }
                    const { refreshToken, accessToken } =
                        await this.creatingJwtAccRefTokens(
                            name,
                            email,
                            rememberMe,
                        );
                    if (!refreshToken || !accessToken) {
                        console.log(
                            `Error: JWT tokens were not created properly in searchForEmail function`,
                        );
                        return res.redirect('/checkUser');
                    }
                    this.createCookies(res, refreshToken, accessToken);
                    console.log(
                        `User account merged: Google ID linked to existing email ${email} was successfully`,
                    );
                    return res.redirect('/new-main');
                } else {
                    const createNewUserGoogle = await pool.query(
                        `INSERT INTO "Users" (username, email, is_verified, remember_me, google_id, provider) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
                        [
                            name,
                            email,
                            isVerified,
                            rememberMe,
                            googleId,
                            provider,
                        ],
                    );
                    if (createNewUserGoogle.rowCount == 0) {
                        console.log(
                            `Creating new user in createNewUserGoogle was failed`,
                        );
                        return res.redirect('/checkUser');
                    }
                    const { refreshToken, accessToken } =
                        await this.creatingJwtAccRefTokens(
                            name,
                            email,
                            rememberMe,
                        );
                    if (!refreshToken || !accessToken) {
                        console.log(
                            `Error: JWT tokens were not created properly in createNewUserGoogle function`,
                        );
                        return res.redirect('/checkUser');
                    }
                    this.createCookies(res, refreshToken, accessToken);
                    console.log(
                        `Creating new user via Google was successfully`,
                    );
                    res.redirect('/new-main');
                }
            },
        )(req, res, next);
    };

    // Searching Suggestions for SearchBar
    searchingSugges = async (req, res) => {
        const query = req.query.query;
        if (!query) {
            console.log(`searchingSugges function havn't recive any info`);
            return res.status(400).json();
        }

        const searchingInApi = await axios.get(
            'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            {
                params: {
                    input: query,
                    key: process.env.GOOGLE_API_KEY,
                    types: 'establishment',
                    language: 'uk',
                    components: 'country:ua',
                },
            },
        );
        const suggestions = searchingInApi.data.predictions.map((place) => ({
            description: place.description,
            place_id: place.place_id,
        }));
        res.json(suggestions);
    };


    //Searching Information about Place from Suggestions
    placeInfFromSugg = async (req, res) => {
    const query = req.query.query
    if(!query) {
        console.log(`Place Inf From Suggestions Function havn't recive any data`);
        return res.status(400).json()
    }
    const gettingData = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
            params: {
                place_id: query,
                key: process.env.GOOGLE_API_KEY,
                fields: 'name',
            },
        },
    );
    console.log(`Data:${gettingData.data}`);
    return res.status(200).json(gettingData.data);

};



    //  async function getCityInfo(req, res) {
    //   try {
    //     const city = req.query.city;
    //     if (!city) return res.status(400).json({ error: 'City is required' });

    //     // Основна інформація про місто
    //     const cityQuery = `
    //       SELECT name, description, rating, population
    //       FROM cities
    //       WHERE LOWER(name) = LOWER($1)
    //       LIMIT 1
    //     `;
    //     const cityResult = await pool.query(cityQuery, [city]);
    //     if (cityResult.rows.length === 0) {
    //       return res.status(404).json({ error: 'City not found' });
    //     }
    //     const cityInfo = cityResult.rows[0];

    //     // Круті місця поряд
    //     const placesQuery = `
    //       SELECT id, name, category, address, lat, lon
    //       FROM places
    //       WHERE city_id = (SELECT id FROM cities WHERE LOWER(name) = LOWER($1))
    //         AND category IN ('кафе', 'готель', 'торговий центр', 'історичне місце')
    //       LIMIT 5
    //     `;
    //     const placesResult = await pool.query(placesQuery, [city]);

    //     // Відгуки про місто
    //     let reviews = [];
    //     if (placesResult.rows.length > 0) {
    //       const reviewsQuery = `
    //         SELECT id, user_name, rating, comment, created_at
    //         FROM reviews
    //         WHERE city_id = (SELECT id FROM cities WHERE LOWER(name) = LOWER($1))
    //         ORDER BY created_at DESC
    //         LIMIT 10
    //       `;
    //       const reviewsResult = await pool.query(reviewsQuery, [city]);
    //       reviews = reviewsResult.rows;
    //     }

    //     res.json({
    //       city: cityInfo,
    //       places: placesResult.rows,
    //       reviews,
    //     });
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: 'Server error' });
    //   }
    // }

    //  addReview(req, res) {
    //   try {
    //     const { city, user_name, rating, comment } = req.body;
    //     if (!city || !user_name || !rating || !comment) {
    //       return res.status(400).json({ error: 'Missing required fields' });
    //     }

    //     const cityCheck = await pool.query('SELECT id FROM cities WHERE LOWER(name) = LOWER($1)', [city]);
    //     if (cityCheck.rows.length === 0) return res.status(404).json({ error: 'City not found' });
    //     const cityId = cityCheck.rows[0].id;

    //     // Додати відгук
    //     const insertQuery = `
    //       INSERT INTO reviews(city_id, user_name, rating, comment, created_at)
    //       VALUES ($1, $2, $3, $4, NOW())
    //       RETURNING id
    //     `;
    //     const insertResult = await pool.query(insertQuery, [cityId, user_name, rating, comment]);
    //     res.json({ success: true, reviewId: insertResult.rows[0].id });
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: 'Server error' });
    //   }
    // }
}

module.exports = Controller;
