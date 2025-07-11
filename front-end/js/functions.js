
//----------------  Class with functions for auth_fr.js --> authentication.html  -----------------------------------------
 class authFunctionsHandler {
     resentEmail = async (email) => {
         const obj = {
             email,
         };
         try {
             const sentEmail = await fetch(
                 'http://localhost:3500/resent-email',
                 {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json',
                     },
                     body: JSON.stringify(obj),
                 },
             );
         } catch (err) {
             console.log(`Internal sevrver error`);
             throw new Error(`Problem with server: ${err.statusText}`);
         }
     };

     loadingRegAnimation = () => {
         const regBlock = document.getElementById('registratioBlock');
         const loadingBlock = document.querySelector('.block_for_all_loading_animation');
         regBlock.classList.replace('validRegLogForm', 'invalidRegLogForm');
         regBlock.classList.remove('auth_active');
         loadingBlock.classList.replace('inactive_loading_block', 'active_loading_block');

     };
     loadingLogAnimation = () => {
         const logBlock = document.getElementById('loginBlock');
         const loadingBlock = document.querySelector('.block_for_all_loading_animation');
         logBlock.classList.replace('validRegLogForm', 'invalidRegLogForm');
         loadingBlock.classList.replace('inactive_loading_block', 'active_loading_block');
     };
     //--------------------- Function about Offer to Confirm Email -----------------------------------------------------
     offerToConfirmEmail = async (createdEmail) => {
         const mainBlockForAll = document.querySelector('.main_block_for_all');
         const loadingBlock = document.getElementById('loadingBlock');
         loadingBlock.classList.add('invalidRegForm');
         mainBlockForAll.innerHTML = `
           <div class="offerToConfirm_main_block">
             <div class="offerToConfirm_sub_block">
               <div class="otc_block_for_img_01">
                 <img class="otc_header_img" src="../img/email-6370595_1280.jpg" alt="">
               </div>
               <h1 class="otc_header_text">Email Confirmation</h1>
               <div class="block_for_center_img">
                 <div class="otc_block_for_img_02">
                   <img class="otc_center_img" src="../img/mail-2048128_640.png" alt="">
                 </div>
               </div>
             <div class="otc_block_for_text">
               <p class="otc_sub_text">We have sent email to <span class="otc_email_text">${createdEmail}</span> to confirm the validity of your email address. After receiving the email follow the link provided complete your registration </p>
               <p class="otc_sub_text_02">Once you confirm your email, your account will be activated</p>
             </div>
             <div class="block_for_line">
               <div class="otc_line"></div>
             </div>
             <p class="otc_ask_for_resent">If you haven't received any emails from us</p>
             <div class="block_for_timer"></div>
             <div class="otc_block_for_btn">
               <button class="otc_btn" id="otcResendEmail">Resend Email</button>
             </div>
            </div>
           </div>`;

         const resentBtn = document.getElementById('otcResendEmail');
         if (!resentBtn) {
             return console.log(`Page not fully loaded`);
         }
         const resBtnBaseText = resentBtn.innerText;
         resentBtn.addEventListener('click', () => {
             const blockTimer = document.querySelector('.block_for_timer');
             let timer = 30;
             resentBtn.disabled = true;
             resentBtn.style.opacity = 0.5;
             resentBtn.style.pointerEvents = 'none';
             const counting = setInterval(() => {
                 timer--;
                 blockTimer.innerHTML = `
                    <p class="timer">You can reset your email in ${timer}s</p>`;
                 if (timer <= 0) {
                     clearInterval(counting);
                     resentBtn.disabled = false;
                     resentBtn.style.opacity = 1;
                     resentBtn.style.pointerEvents = 'auto';
                     const timerHtml = document.querySelector('.timer');
                     timerHtml.remove();
                 }
             }, 1000);
             // here function sendemail
             this.resentEmail(createdEmail);
         });

         return;
     };
     //---------------------------Function for Creating Answer from Server in Registration form------------------------
     answerRegError = async (errorText) => {
         const loadingBlock = document.getElementById('loadingBlock');
         const regBlock = document.getElementById('registratioBlock');
         const answerBlock = document.querySelector('.block_for_answer_reg');
         const registrationForm = document.getElementById('Registration_form');

         if (!loadingBlock || !regBlock || !answerBlock) {
             console.error('One of this element is not exist');
             return;
         }

         answerBlock.innerHTML = '';

         loadingBlock.classList.replace('active_loading_block', 'inactive_loading_block');
         regBlock.classList.replace('invalidRegLogForm', 'validRegLogForm');
         regBlock.classList.add('auth_active');

         registrationForm.reset();
         answerBlock.innerHTML = errorText;
     };
     //---------------------------Function for Creating Answer from Server in Login form------------------------
     answerLogError = async (errorText) => {
         const loadingBlock = document.getElementById('loadingBlock');
         const loginBlock = document.getElementById('loginBlock');
         const answerBlock = document.querySelector('.block_for_answer_log');
         const loginForm = document.getElementById('Login_form');

         if (!loadingBlock || !loginBlock || !answerBlock) {
             console.error('One of this element is not exist');
             return;
         }

         answerBlock.innerHTML = '';

         loadingBlock.classList.replace('active_loading_block', 'inactive_loading_block');
         loginBlock.classList.replace('invalidRegLogForm', 'validRegLogForm');

         loginForm.reset();
         answerBlock.innerHTML = errorText;
     };
     //---------------------- Function to control Log In answer of status code from back end -----------------------------
     statusLogInController = (status, redirectUrl) => {
         if (!status) {
             console.log(`Status controller have not status receive`);
             return;
         }
         //---------Error Text HTML----------------------
         // const success200 = `<h1 class="answer_text">You have successfully logged in</h1>`
         const wrongLogOrErrError401 = `<h1 class="answer_text">Wrong login or password</h1>`;
         const tooManyRequestsError429 = `<h1 class="answer_text">Too many requests, please try again later</h1>`;
         const unknowProblemErrorDef = `<h1 class="answer_text">An error occurred, we are working on it</h1>`;

         switch (status) {
             case 200:
                 if (redirectUrl) {
                     console.log(`Redirected to new-main`);
                     window.location.href = redirectUrl;
                 } else {
                     console.log(
                         `Log in (status 200) failed cause we have not get from back redirectUrl`,
                     );
                 }
                 break;
             case 401:
                 this.answerLogError(wrongLogOrErrError401);
                 break;
             case 429:
                 this.answerLogError(tooManyRequestsError429);
                 break;
             default:
                 this.answerLogError(unknowProblemErrorDef);
                 break;
         }
     };
     //---------------------- Function to control Sign Up answer of status code from back end ------------------------
     statusSignUpController = (status, createdEmail) => {
         if (!status) {
             return console.log(`Status controller have not status receive`);
         }
         //---------Error Text HTML----------------------
         const correctnessError400 = `<h1 class="answer_text">Please check the correctness of the entered data</h1>`;
         const existUserError409 = `<h1 class="answer_text">Registration failed, check your details</h1>`;
         const tooManyRequestsError429 = `<h1 class="answer_text">Too many requests, please try again later</h1>`;
         const unknowProblemErrorDef = `<h1 class="answer_text">An error occurred, we are working on it</h1>`;

         switch (status) {
             case 201:
                 this.offerToConfirmEmail(createdEmail);
                 break;
             case 400:
                 this.answerRegError(correctnessError400);
                 break;
             case 409:
                 this.answerRegError(existUserError409);
                 break;
             case 429:
                 this.answerRegError(tooManyRequestsError429);
                 break;
             default:
                 this.answerRegError(unknowProblemErrorDef);
                 break;
         }
     };

     //--------------------- Function for Log In -----------------------------------------------------
     sendLogIn = async (obj) => {
         try {
             const sendingData = await fetch(
                 'http://localhost:3500/api/logIn',
                 {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json',
                     },
                     credentials: 'include',
                     body: JSON.stringify(obj),
                 },
             );
             if (sendingData.ok) {
                 const data = await sendingData.json();
                 this.statusLogInController(sendingData.status, data.redirectUrl);
             } else {
                 this.statusLogInController(sendingData.status);
             }
         } catch (err) {
             console.log(`Internal sevrver error`);
             throw new Error(`Problem with server: ${err.statusText}`);
         }
     };
     // --------------------- Function for Sign Up ------------------------------------------------------
     sendSignUp = async (obj) => {
         try {
             const sendingData = await fetch(
                 'http://localhost:3500/api/signUp',
                 {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json',
                     },
                     body: JSON.stringify(obj),
                 },
             );
             const responseData = await sendingData.json();
             if (!responseData.createdEmail) {
                 return console.log(`No email arrived from the server`);
             }
             this.statusSignUpController(
                 sendingData.status,
                 responseData.createdEmail,
             );
         } catch (err) {
             console.log(`Internal sevrver error`);
             throw new Error(`Problem with server: ${err.statusText}`);
         }
     };
     // --------------------- Function for Resent Password ------------------------------------------------------
     sendResetPasswordEmail = async (obj) =>{
        try{
            const sendingEmail = await fetch(
                'http://localhost:3500/api/resetPasword',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(obj),
                },
            );
            if(sendingEmail.status===200){
                 const answerBlock = document.querySelector(`.rp_footer_block_for_answer`);
                 return answerBlock.innerHTML = `<h1 class="rp_footer_answer_text">Reset instructions have been sent to your email.</h1>`;
            }
           
        }catch(err){
             console.log(`Internal sevrver error`);
             throw new Error(`Problem with server: ${err.statusText}`);
        }

     } 

     //-------------------- Function for Controll Password Visibility ---------------------------------------
     controllPasswordVisibility = (
         passwordField,
         passwordLockBtn,
         showPassword,
         blockPassword,
     ) => {
         if (passwordField.type === 'password') {
             passwordField.type = 'text'; // Show password
             passwordLockBtn.style.opacity = '0';
             setTimeout(() => {
                 passwordLockBtn.style.backgroundImage = blockPassword;
                 passwordLockBtn.style.opacity = '1';
             }, 200);
         } else {
             passwordField.type = 'password'; // Block passsword
             passwordLockBtn.style.opacity = '0';
             setTimeout(() => {
                 passwordLockBtn.style.opacity = '1';
                 passwordLockBtn.style.backgroundImage = showPassword;
             }, 200);
         }
     };
 }

//----------------Class with functions for front_mainpage.js --> mainpage.html------------------------------------------------------
class mainPageFunctionsHandler {
    //------------------------ Sending Cookie for Log Out ----------------------------------
    logOut = async () => {
        try {
            const sendingTokens = await fetch('http://localhost:3500/logOut', {
                method: 'POST',
                credentials: 'include', // Sending Cookie
            });
            if (!sendingTokens.ok) {
                throw new Error(
                    `Server error: ${sendingTokens.status} ${sendingTokens.statusText}`,
                );
            }
            const response = await sendingTokens.json();
            if (sendingTokens.status === 200) {
                console.log(
                    `Auth Page successfully opened, Redirected Url:${response.redirectUrl}`,
                );
                window.location.href = response.redirectUrl;
            } else {
                console.log(`Probllem with Log Out btn`);
            }
        } catch (err) {
            return console.log(`Log Out is faied: ${err.message}`);
        }
    };

    //------------------------ Search Field, Searching and Showing Suggestions ----------------------------------
    searchingSugges = async (city) => {
        try{
            const suggestionsElement = document.getElementById('suggestionsList');
            const sendingInf = await fetch(`/api/suggestions?query=${encodeURIComponent(city)}`);
            if(!sendingInf.ok) {
                 console.log(`Function searchingSugges isn't working`)
                 suggestionsElement.innerHTML = ``;
                 return;
            }
            const data = await sendingInf.json();
            suggestionsElement.innerHTML = ``;

            data.forEach(obj => {
                const placeId = obj.place_id;
                const listElement = document.createElement('li');
                listElement.textContent = obj.description;
                suggestionsElement.appendChild(listElement);
             
                listElement.addEventListener('click', async () => {
                    try{
                        const suggesMoreInf = await fetch(`/api/suggestions/placeInf?query=${placeId}`);
                        if(!suggesMoreInf.ok) {
                            console.log(`Geting more info about place is failed`)
                            suggestionsElement.innerHTML = ``;
                            return
                        }
                        const placeInf = await suggesMoreInf.json();
                        console.log(placeInf);
                        return;


                    }catch(err){
                        console.log(`Internal sevrver error`);
                        throw new Error(`Problem with server: ${err.statusText}`);
                    }
                });

            });
            
       
            return

        }catch(err){
            console.log(`Internal sevrver error`);
            throw new Error(`Problem with server: ${err.statusText}`);
        }
    }
}

//----------------Class with functions for front_index.js --> index.html------------------------------------------------------
class indexFunctionsHandler {

}
//----------------Class with functions for reset_password.js --> reset_password.html------------------------------------------------------
class resetPasswordFunctionsHandler {
    
    //-------------------- Function for Sending Code ---------------------------------------
    sendCode = async (obj) => {
        if (!obj) {
            return console.log(`Send Code Function dont get the code`);
        }
        try {
            const sendingCode = await fetch(
                'http://localhost:3500/api/resetPassword/OpenEnterPage/checkVerificationCode',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(obj),
                },
            );
            const answerBlock = document.querySelector('.block_for_answer_01');
            if (sendingCode.status == 200) {
                const codeForm = document.querySelector('.block_for_swiping');
                const passwordForm = document.querySelector(
                    '.block_for_swipng_02',
                );
                const updatedBtn = document.getElementById('changePasswordBtn');

                codeForm.classList.add('swiping_hidden');
                passwordForm.classList.replace(
                    'swiping_hidden',
                    'swiping_visible',
                );
                updatedBtn.classList.replace(
                    'toLoginBtn_hidden',
                    'toLoginBtn_visible',
                );
            } else if (sendingCode.status == 410) {
                answerBlock.innerHTML = `<span>Reset code expired — no worries, get a new one</span>`;
            } else {
                let time = 30;
                const countdown = setInterval(() => {
                    answerBlock.innerHTML = `<span style="color:rgb(126, 1, 1);">Incorrect code</span> entered, please try again <span class = "time_with_words">in <span style="color:rgb(3, 64, 105)"; class = "timer"></span>s.</span>`;
                    const timerElement = document.querySelector('.timer');
                    time--;
                    timerElement.textContent = time;

                    if (time <= 0) {
                        clearInterval(countdown);
                        const timeWords = (document.querySelector(
                            '.time_with_words',
                        ).textContent = '');
                    }
                }, 1000);

                const sendCodeBtn = document.getElementById('sendCodeFormBtn');
                sendCodeBtn.style.backgroundColor = '#6e8ffbc5';
                sendCodeBtn.disabled = true;
                sendCodeBtn.style.pointerEvents = 'none';
                setTimeout(() => {
                    sendCodeBtn.disabled = false;
                    sendCodeBtn.style.pointerEvents = 'auto';
                    sendCodeBtn.style.backgroundColor = '#6e8efb';
                }, 30000);

                return;
            }
        } catch (err) {
            console.log(`Internal sevrver error`);
            throw new Error(`Problem with server: ${err.statusText}`);
        }
    };

    //-------------------- Function for Sending Password ---------------------------------------
    sendPassword = async (obj) => {
        if (!obj) return console.log(`Password is required`);
        try {
            const sendingPassword = await fetch(
                'http://localhost:3500/api/resetPassword/OpenEnterPage/creatingNewPassword',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(obj),
                },
            );
            if (!sendingPassword.ok) {
                console.log(`Password was NOT updated`);
                disableLoginBtn();
                return;
            }
            console.log(`Password was updated`);
            return;
        } catch (err) {
            console.log(`Internal sevrver error`);
            throw new Error(`Problem with server: ${err.statusText}`);
        }
    };
    //-------------------- Function for Sending Reset Code to Delete ---------------------------------------
    sendDeletingResedCode = async (code) => {
       const sendingCode = await fetch('http://localhost:3500/api/resetPassword/OpenEnterPage/deleteResetCode', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({resetCode: code})
       })
       const data = await sendingCode.json();
       if (data.redirectTo) {
        console.log(`url: ${data.redirectTo}`);
           return window.location.href = data.redirectTo;
       }
    };
    

}
//--------------Export classes in another files-----------------------------------
export { authFunctionsHandler, mainPageFunctionsHandler, indexFunctionsHandler, resetPasswordFunctionsHandler };