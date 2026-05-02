import {authFunctionsHandler} from "./functions.js"
const Functions = new authFunctionsHandler()

const AUTH_TRANSLATIONS = {
uk: {
    greetingRegister: 'Створити акаунт',
    greetingRegisterSub: 'Почніть свою подорож',
    greetingLogin: 'Увійти в акаунт',
    greetingLoginSub: 'Продовжуйте свою подорож',
    googleSignUp: 'Зареєструватися через Google',
    googleSignIn: 'Увійти через Google',
    orText: 'Або',
    placeholderName: "Ім'я",
    placeholderEmail: 'Електронна пошта',
    placeholderPassword: 'Пароль',
    remember: 'Запам’ятати мене',
    register: 'Реєстрація',
    login: 'Увійти',
    openLogIn: 'Увійти',
    openRegister: 'Зареєструватися',
    alreadyHave: 'Вже маєте акаунт?',
    dontHave: 'Ще не маєте акаунту?',
    forgotPassword: 'Забули пароль?',
    resetPassword: 'Відновити зараз',
    returnToLogin: 'Повернутися до входу',
    resetHeader: 'Забули пароль?',
    resetSub: 'Введіть ваш Email для відновлення!',
    resetEmail: 'Введіть Email',
    confirm: 'Підтвердити',
    home: 'Головна'
},
    en: {
        greetingRegister: 'Create an Account',
        greetingRegisterSub: 'Start your journey',
        greetingLogin: 'Log In to your Account',
        greetingLoginSub: 'Continue your journey',
        googleSignUp: 'Sign up with Google',
        googleSignIn: 'Sign in with Google',
        orText: 'Or',
        placeholderName: 'Name',
        placeholderEmail: 'Email',
        placeholderPassword: 'Password',
        remember: 'Remember me',
        register: 'Register',
        login: 'Login',
        openLogIn: 'Log in',
        openRegister: 'Register',
        alreadyHave: 'Already have an account?',
        dontHave: 'Don’t have an account yet?',
        forgotPassword: 'Forgot your password?',
        resetPassword: 'Reset it now',
        returnToLogin: 'Return back to login',
        resetHeader: 'Forgot your Password?',
        resetSub: 'Enter your email to reset it!',
        resetEmail: 'Enter your email',
        confirm: 'Confirm',
        home: 'Home'
    },
    de: {
        greetingRegister: 'Erstelle ein Konto',
        greetingRegisterSub: 'Beginne deine Reise',
        greetingLogin: 'Melde dich an',
        greetingLoginSub: 'Setze deine Reise fort',
        googleSignUp: 'Mit Google registrieren',
        googleSignIn: 'Mit Google anmelden',
        orText: 'Oder',
        placeholderName: 'Name',
        placeholderEmail: 'E-Mail',
        placeholderPassword: 'Passwort',
        remember: 'Angemeldet bleiben',
        register: 'Registrieren',
        login: 'Anmelden',
        openLogIn: 'Anmelden',
        openRegister: 'Registrieren',
        alreadyHave: 'Hast du bereits ein Konto?',
        dontHave: 'Noch kein Konto?',
        forgotPassword: 'Passwort vergessen?',
        resetPassword: 'Zurücksetzen',
        returnToLogin: 'Zurück zum Login',
        resetHeader: 'Passwort vergessen?',
        resetSub: 'Gib deine E-Mail ein, um es zurückzusetzen',
        resetEmail: 'Gib deine E-Mail ein',
        confirm: 'Bestätigen',
        home: 'Startseite'
    },
    pl: {
        greetingRegister: 'Utwórz konto',
        greetingRegisterSub: 'Rozpocznij swoją podróż',
        greetingLogin: 'Zaloguj się',
        greetingLoginSub: 'Kontynuuj swoją podróż',
        googleSignUp: 'Zarejestruj się przez Google',
        googleSignIn: 'Zaloguj się przez Google',
        orText: 'Lub',
        placeholderName: 'Imię',
        placeholderEmail: 'Email',
        placeholderPassword: 'Hasło',
        remember: 'Zapamiętaj mnie',
        register: 'Zarejestruj się',
        login: 'Zaloguj się',
        openLogIn: 'Zaloguj się',
        openRegister: 'Zarejestruj się',
        alreadyHave: 'Masz już konto?',
        dontHave: 'Nie masz jeszcze konta?',
        forgotPassword: 'Zapomniałeś hasła?',
        resetPassword: 'Zresetuj',
        returnToLogin: 'Powrót do logowania',
        resetHeader: 'Zapomniałeś hasła?',
        resetSub: 'Wpisz swój e-mail, aby zresetować',
        resetEmail: 'Wpisz swój e-mail',
        confirm: 'Potwierdź',
        home: 'Strona główna'
    }
}

function getSavedAuthLanguage() {
    return localStorage.getItem('topspots_locale') || 'en';
}

function applyAuthLanguage(locale) {
    const dict = AUTH_TRANSLATIONS[locale] || AUTH_TRANSLATIONS.en;
    const languageSelect = document.getElementById('authLanguageSelect');
    if (languageSelect) languageSelect.value = locale;

    const greetings = document.querySelectorAll('.greeting_text_01');
    if (greetings[0]) greetings[0].textContent = dict.greetingRegister;
    if (greetings[1]) greetings[1].textContent = dict.greetingLogin;

    const subtitles = document.querySelectorAll('.greeting_text_02');
    if (subtitles[0]) subtitles[0].textContent = dict.greetingRegisterSub;
    if (subtitles[1]) subtitles[1].textContent = dict.greetingLoginSub;

    const googleRegister = document.querySelector('#registratioBlock .google-btn span');
    const googleLogin = document.querySelector('#loginBlock .google-btn span');
    if (googleRegister) googleRegister.textContent = dict.googleSignUp;
    if (googleLogin) googleLogin.textContent = dict.googleSignIn;

    document.querySelectorAll('.or_text').forEach(el => el.textContent = dict.orText);
    document.querySelectorAll('input[name="username"]').forEach(el => el.placeholder = dict.placeholderName);
    document.querySelectorAll('input[name="email"]').forEach(el => el.placeholder = dict.placeholderEmail);
    document.querySelectorAll('input[type="password"]').forEach(el => el.placeholder = dict.placeholderPassword);

    document.querySelectorAll('.Check_remember').forEach(label => {
        if (label.lastChild) label.lastChild.textContent = ` ${dict.remember}`;
    });

    const registerBtn = document.querySelector('#register_btn span');
    const loginBtn = document.querySelector('#login_btn span');
    if (registerBtn) registerBtn.textContent = dict.register;
    if (loginBtn) loginBtn.textContent = dict.login;

    const openLogInBtn = document.getElementById('openLogIn');
    const openRegisterBtn = document.getElementById('openRegister');
    if (openLogInBtn) openLogInBtn.textContent = dict.openLogIn;
    if (openRegisterBtn) openRegisterBtn.textContent = dict.openRegister;

    const alreadyText = document.querySelector('#registratioBlock .logAndreg_text');
    if (alreadyText) {
        const button = alreadyText.querySelector('#openLogIn');
        if (button) button.textContent = dict.openLogIn;
        const textNode = Array.from(alreadyText.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = `${dict.alreadyHave} `;
    }
    const dontHaveText = document.querySelector('#loginBlock .logAndreg_text');
    if (dontHaveText) {
        const button = dontHaveText.querySelector('#openRegister');
        if (button) button.textContent = dict.openRegister;
        const textNode = Array.from(dontHaveText.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = `${dict.dontHave} `;
    }

    const resetTitle = document.querySelector('.text_reset_password');
    if (resetTitle) {
        const button = resetTitle.querySelector('#resetPassword');
        if (button) button.textContent = dict.resetPassword;
        const textNode = Array.from(resetTitle.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = `${dict.forgotPassword} `;
    }

    const resetHeader = document.querySelector('.rp_header_text_01');
    const resetSub = document.querySelector('.rp_header_text_02');
    if (resetHeader) resetHeader.textContent = dict.resetHeader;
    if (resetSub) resetSub.textContent = dict.resetSub;

    const resetEmailInput = document.querySelector('.rp_footer_email');
    if (resetEmailInput) resetEmailInput.placeholder = dict.resetEmail;

    const confirmBtn = document.getElementById('confirmResentPasswordBtn');
    if (confirmBtn) confirmBtn.textContent = dict.confirm;

    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) returnBtn.textContent = dict.returnToLogin;

    const homeBtn = document.getElementById('homePageBtn');
    if (homeBtn) homeBtn.textContent = dict.home;
}

function applyAuthTheme(isLight) {
    document.body.classList.toggle('light-theme', isLight);
    const themeToggle = document.getElementById('authThemeToggle');
    if (themeToggle) themeToggle.textContent = isLight ? '🌞' : '🌙';
    localStorage.setItem('topspots_theme', isLight ? 'light' : 'dark');
}

function initAuthControls() {
    const languageSelect = document.getElementById('authLanguageSelect');
    if (languageSelect) {
        languageSelect.value = getSavedAuthLanguage();
        languageSelect.addEventListener('change', () => {
            const locale = languageSelect.value;
            localStorage.setItem('topspots_locale', locale);
            applyAuthLanguage(locale);
        });
    }

    const themeToggle = document.getElementById('authThemeToggle');
    const savedTheme = localStorage.getItem('topspots_theme') || 'dark';
    applyAuthTheme(savedTheme === 'light');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = !document.body.classList.contains('light-theme');
            applyAuthTheme(isLight);
        });
    }
    applyAuthLanguage(getSavedAuthLanguage());
}

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

    const homePageBtn = document.getElementById('homePageBtn');
    if (homePageBtn) {
        homePageBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
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

// Language and theme handling
document.addEventListener('DOMContentLoaded', () => {
    initAuthControls();
});










   
