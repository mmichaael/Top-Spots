import {authFunctionsHandler} from "./functions.js"
const Functions = new authFunctionsHandler()


//---------------LOG IN--------------------------------------------
const loginForm = document.getElementById('Login_form')
loginForm.addEventListener('submit', async (event)=>{
    event.preventDefault()
    
    if(!loginForm.checkValidity()){ 
        return console.log(`LogIn form is not valid`) 
    }
    
    const formObj = new FormData(loginForm)
    const inputValues = Object.fromEntries(formObj.entries())
    const rememberMe = document.getElementById('rememberMeLog').checked
    const { email, password } = inputValues
    inputValues.remember = rememberMe
    

    if(!email?.trim() || !password?.trim()){
        const loginAnswer = document.querySelector('.block_for_answer_log')
        return loginAnswer.innerHTML=`<h1 class="answer_text">Login and password are required</h1>` 
    }
    Functions.loadingLogAnimation()
    const sendingData = await Functions.sendLogIn(inputValues);
})

//---------------SIGN UP--------------------------------------------
const signUpForm = document.getElementById('Registration_form')
signUpForm.addEventListener('submit', async(event)=>{
    event.preventDefault()

    if(!signUpForm.checkValidity()){
        return console.log(`SignUp form is not valid`) 
    }

    const formObj = new FormData(signUpForm)
    const  inputValues = Object.fromEntries(formObj.entries())
    const rememberMe = document.getElementById('rememberMeReg').checked;
    const {username, email, password}= inputValues
    inputValues.remember = rememberMe;
    const signupAnswer = document.querySelector('.block_for_answer_reg');

    if(!username?.trim() || !email?.trim() || !password?.trim()) return signupAnswer.innerHTML=`<h1 class="answer_text">Usernaame, login and password are required</h1>`;

    if (password.length <= 8) {
        console.log(`Oops! Your password needs to be at least 8 characters`);
         signupAnswer.innerHTML = `<h1 class="answer_text">Your password is a bit short — try 8 characters or more</h1>`;
         return;
    }

    Functions.loadingRegAnimation()
    const sendingData = await Functions.sendSignUp(inputValues)
})

//---------------RESET PASSWORD--------------------------------------------
    const resetPasswordForm = document.getElementById('Resent_Password_Form');
    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!resetPasswordForm.checkValidity()) {
            return console.log(`Reset Password form is not valid`);
        }

        const formObj = new FormData(resetPasswordForm);
        const resetPasswordObj = Object.fromEntries(formObj.entries());
        const { resentPasswordEmail } = resetPasswordObj;

        if (!resentPasswordEmail.trim()) {
            const blockForAnswer = document.querySelector(`.rp_footer_block_for_answer`);
            return blockForAnswer.innerHTML = `<h1 class="rp_footer_answer_text">Email is required</h1>`;
        }

        const confirmBtn = document.getElementById('confirmResentPasswordBtn');
        confirmBtn.disabled = true;
        confirmBtn.style.pointerEvents = 'none';
        confirmBtn.style.backgroundColor = '#242424';
        
        const resentBtn = document.getElementById('tryAgainResentPasswordBtn');
        const blockForTime = document.querySelector('.try_again_span');
        let timer01 = 21;
        let timer02 = 61;
        if (resentBtn.disabled === true) {
            disableConfirmBtn(timer01, resentBtn, blockForTime);
        } else {
            disableConfirmBtn(timer02, resentBtn, blockForTime);
        }
       
        const sendingEmail = await Functions.sendResetPasswordEmail(resetPasswordObj);
    
    });
function disableConfirmBtn(timer, resentBtn, blockForTime) {
    const timeOutTime = timer;
    const intervalId = setInterval(() => {
        timer--;
        blockForTime.textContent = `in ${timer}s`;
        resentBtn.style.pointerEvents = 'none';
        if (timer <= 0) clearInterval(intervalId);
    }, 1000);

    setTimeout(() => {
        resentBtn.disabled = false;
        resentBtn.style.pointerEvents = 'auto';
        blockForTime.innerHTML = '';
    }, timeOutTime * 1000); 
    return
}



//------------------------------------ Move Login/Register/Reset Password form-----------------------------------------------
document.addEventListener('DOMContentLoaded', ()=>{
    const registerForm = document.getElementById('registratioBlock');
    const loginBlock = document.getElementById('loginBlock')
    const resetPasswordBlock = document.querySelector('.reset_password_block');
    
// from registration in login
    const openLogIn = document.getElementById('openLogIn');
    openLogIn.addEventListener('click', () => {
        registerForm.classList.toggle('auth_active')
        registerForm.classList.toggle('auth_inactive')
        loginBlock.classList.toggle('auth_inactive')
        loginBlock.classList.toggle('auth_active')

        registerForm.classList.replace('validRegLogForm', 'invalidRegLogForm');
        loginBlock.classList.replace('invalidRegLogForm', 'validRegLogForm');
  })
// from login in registration
    const openRegisterBtn = document.getElementById('openRegister')
    openRegisterBtn.addEventListener('click', ()=>{
        loginBlock.classList.toggle('auth_active')
        loginBlock.classList.toggle('auth_inactive')
        registerForm.classList.toggle('auth_inactive')
        registerForm.classList.toggle('auth_active')

        loginBlock.classList.replace('validRegLogForm', 'invalidRegLogForm');
        registerForm.classList.replace('invalidRegLogForm', 'validRegLogForm');
        
   })
//from login in reset password
    const resetPassword = document.getElementById('resetPassword'); 
    resetPassword.addEventListener('click', () => {
       loginBlock.classList.toggle('auth_active');
       loginBlock.classList.toggle('auth_inactive');
       resetPasswordBlock.classList.toggle('auth_active')
       resetPasswordBlock.classList.toggle('auth_inactive')

       loginBlock.classList.replace('validRegLogForm', 'invalidRegLogForm');
   })
//from reset password in login
    const returnBtn = document.getElementById('returnBtn');
    returnBtn.addEventListener('click', ()=>{
        loginBlock.classList.toggle('auth_active');
        loginBlock.classList.toggle('auth_inactive');
        resetPasswordBlock.classList.toggle('auth_active');
        resetPasswordBlock.classList.toggle('auth_inactive');

        loginBlock.classList.replace('invalidRegLogForm', 'validRegLogForm');
    })
})
//------------------------------------ Right Side Change Photo-----------------------------------------------
document.addEventListener('DOMContentLoaded', ()=>{
    const img = [
        '../img/auth/photo_2025-01-31_23-28-51.jpg', '../img/auth/photo_2025-01-31_23-28-52.jpg', '../img/auth/photo_2025-01-31_23-28-53.jpg', 
        '../img/auth/photo_2025-01-31_23-28-54.jpg', '../img/auth/photo_2025-01-31_23-28-55.jpg', '../img/auth/photo_2025-01-31_23-28-57.jpg',
        '../img/auth/photo_2025-01-31_23-28-59.jpg', '../img/auth/photo_2025-01-31_23-29-00.jpg', '../img/auth/photo_2025-01-31_23-29-03.jpg', 
        '../img/auth/photo_2025-01-31_23-29-05.jpg', '../img/auth/photo_2025-01-31_23-29-06.jpg', '../img/auth/photo_2025-01-31_23-29-07.jpg',
        '../img/auth/photo_2025-01-31_23-29-08.jpg', '../img/auth/photo_2025-01-31_23-29-09.jpg', '../img/auth/photo_2025-01-31_23-29-10.jpg', 
        '../img/auth/photo_2025-01-31_23-29-11.jpg', '../img/auth/photo_2025-01-31_23-29-12.jpg', '../img/auth/photo_2025-01-31_23-29-13.jpg',
        '../img/auth/photo_2025-01-31_23-29-14.jpg', '../img/auth/photo_2025-01-31_23-29-15.jpg', '../img/auth/photo_2025-01-31_23-29-17.jpg',
        '../img/auth/photo_2025-01-31_23-29-18.jpg', '../img/auth/photo_2025-01-31_23-29-20.jpg', '../img/auth/photo_2025-01-31_23-29-21.jpg',
        '../img/auth/photo_2025-01-31_23-29-22.jpg', '../img/auth/photo_2025-01-31_23-29-23.jpg', '../img/auth/photo_2025-01-31_23-29-24.jpg',
        '../img/auth/photo_2025-01-31_23-29-25.jpg', '../img/auth/photo_2025-01-31_23-29-26.jpg', '../img/auth/photo_2025-01-31_23-29-27.jpg',
        '../img/auth/photo_2025-01-31_23-29-28.jpg', '../img/auth/photo_2025-01-31_23-29-29.jpg', '../img/auth/photo_2025-01-31_23-39-41.jpg'
    ]
        const randomImage = img[Math.floor(Math.random() * img.length)];

        const imgBlock = document.querySelector('.right_main_img');
        
        if (imgBlock) {
            imgBlock.src = randomImage;
        }
})

// ---------------------Show and lock password---------------
//Show and lock in register
const regPasswordField = document.getElementById('regPassword');
const regCheckVsbBtn = document.querySelector('.reg_password_visibility_btn');
regCheckVsbBtn.addEventListener('click', () => {
    const showPassword = "url('../img/opened-Eyes.png')";
    const blockPassword = "url('../img/closed-Eyes.png')";
    Functions.controllPasswordVisibility(regPasswordField, regCheckVsbBtn, showPassword, blockPassword);
});
//Show and lock in log in
const logpasswordField = document.getElementById('logPassword');
const logCheckVsbBtn = document.querySelector('.log_password_visibility_btn');
logCheckVsbBtn.addEventListener('click', () => {
    const showPassword = "url('../img/opened-Eyes.png')";
    const blockPassword = "url('../img/closed-Eyes.png')";
    Functions.controllPasswordVisibility(logpasswordField, logCheckVsbBtn, showPassword, blockPassword);
});










   
