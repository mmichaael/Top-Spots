import  {resetPasswordFunctionsHandler } from './functions.js';
const Functions = new resetPasswordFunctionsHandler();
import { authFunctionsHandler } from './functions.js';
const authFunctions = new authFunctionsHandler();


let verificationCode;
//-------------------------------Function for Verification Reset Code from Email----------------------------------------------
const sendResetCodeForm = document.getElementById('sendCodeForm');
sendResetCodeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!sendResetCodeForm.checkValidity()) {
        return console.log(`Reset Code form is not valid`);
    }

    const Obj = new FormData(sendResetCodeForm);
    const verCodeObj = Object.fromEntries(Obj.entries());
    const { resetCode } = verCodeObj;

    if(!resetCode.trim()){
        const answerBlock = document.querySelector('.block_for_answer_01');
        answerBlock.innerHTML = 'Verification Code is required';
    }
    verificationCode = resetCode;
    const sendingCode = await Functions.sendCode(verCodeObj);
});

//-------------------------------Function for Update new Password und UI Functionality----------------------------------------------
const passwordForm = document.getElementById('passwordForm');
passwordForm.addEventListener('submit', async (event)=>{
    event.preventDefault();

    const obj = new FormData(passwordForm)
    const passwordsObj = Object.fromEntries(obj.entries());
    passwordsObj.resetCode = verificationCode;
    const { newPassword01, newPassword02, resetCode } = passwordsObj;

    const answerBlock01 = document.querySelector('.block_for_answer_03');
    const answerBlock02 = document.querySelector('.block_for_answer_04');
    const progresbarBlock = document.querySelector('.block_for_progresbar');
    const progresbar = document.querySelector('.progresbar'); 
    const updatePasswordBtn = document.getElementById('changePasswordBtn');
    const toLoginBtn = document.getElementById('toLoginBtn'); 
    const inputField01 = document.getElementById('newPassword01');
    const inputField02 = document.getElementById('newPassword02');

    if (!newPassword01.trim() || !newPassword02.trim() || !resetCode.trim()) {
        answerBlock01.innerHTML = `<span class="inner_answer_block_03_01">Please enter a new password</span>`;
        answerBlock02.innerHTML = `<span class="inner_answer_block_03_01">Please confirm your password</span>`;
        progresbarBlock.classList.replace('progresbar_visible', 'progresbar_hidden');
        return;
    }
    function fillStrangeColorMessage (strange, color, message) {
        progresbarBlock.classList.replace('progresbar_hidden', 'progresbar_visible');
        answerBlock02.innerHTML = `<span class="inner_answer_block_03_03"> </span>`;

        progresbar.style.width = strange + '%';
        progresbar.style.backgroundColor = color;
        answerBlock01.innerHTML = message;
    }

    if(newPassword01.length>=8){
        let strange = 0;
        let color;
        const badPasswordMessage = `<span class="inner_answer_block_03_03">Too easy to guess — make it harder to crack</span>`;
        const middlePasswordMessage = `<span class="inner_answer_block_03_03">Needs more variety — try numbers or symbols</span>`;
        const goodPasswordMessage = `<span class="inner_answer_block_03_03">Strong enough — but not unbreakable yet</span>`;
        const exelentPasswordMessage = `<span class="inner_answer_block_03_03">Nice work — your password is strong and reliable</span>`;

        if (newPassword01 != newPassword02) {
            progresbarBlock.classList.replace(
                'progresbar_visible',
                'progresbar_hidden',
            );
            answerBlock01.innerHTML = `<span class="inner_answer_block_03_03"> </span>`;
            answerBlock02.innerHTML = `<span class="inner_answer_block_03_03">Looks like the passwords aren’t the same</span>`;
            return;
        }
        //-----------------Checking for special symbol and our progressbar system------------------------
        if (/[A-Z]/.test(newPassword01)) strange += 0.25;
        if (/[a-z]/.test(newPassword01)) strange += 0.25;
        if (/[0-9]/.test(newPassword01)) strange += 0.25;
        if (/[^A-Za-z0-9]/.test(newPassword01)) strange += 0.25;

        const newStrange = strange * 100;
        if (newStrange <= 25) color = '#cc0505';
        else if (newStrange <= 50) color = '#df720d';
        else if (newStrange <= 75) color = '#25d825';
        else color = '#02e0f0';

        switch (newStrange) {
            case 25:
                fillStrangeColorMessage(newStrange, color, badPasswordMessage);
                break;
            case 50:
                fillStrangeColorMessage(newStrange, color, middlePasswordMessage);
                break;
            case 75:
                fillStrangeColorMessage(newStrange, color, goodPasswordMessage);
                toLoginBtn.classList.replace('toLoginBtn_hidden', 'twoBtn_visible');
                updatePasswordBtn.classList.replace('toLoginBtn_visible', 'twoBtn_visible');
                await Functions.sendPassword(passwordsObj);
                break;
            case 100:
                fillStrangeColorMessage(newStrange, color, exelentPasswordMessage);
                updatePasswordBtn.classList.replace('twoBtn_visible', 'toLoginBtn_delete');
                updatePasswordBtn.classList.replace('toLoginBtn_visible', 'toLoginBtn_delete');
                toLoginBtn.classList.replace('toLoginBtn_hidden', 'twoBtn_visible');
               
                inputField01.readOnly = true;
                inputField02.readOnly = true;
                await Functions.sendPassword(passwordsObj);
                break;

            default:
                break;
        }
    }else{
        progresbarBlock.classList.replace('progresbar_visible', 'progresbar_hidden');;
        answerBlock01.innerHTML = `<span class="inner_answer_block_03_02"><span>Too short...</span> Try using at least 8 characters</span>`;
        answerBlock02.innerHTML = `<span class="inner_answer_block_03_01"> </span>`;
        return;
    }
})
//-------------------------------Function for Deleting Reset Code in the End----------------------------------------------
const loginBtn = document.getElementById('toLoginBtn');
loginBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    if(!verificationCode.trim()){
        console.log(`Login Button havn't reset code`)
        return
    }
    await Functions.sendDeletingResedCode(verificationCode);

})

//-------------------------------Function to look Password in first input field----------------------------------------------
const regPasswordField01 = document.getElementById('newPassword01');
const regCheckVsbBtn01= document.querySelector('.password_visibility_btn_01');
regCheckVsbBtn01.addEventListener('click', () => {
    const showPassword = "url('/img/opened-Eyes.png')";
    const blockPassword = "url('/img/closed-Eyes.png')";
    authFunctions.controllPasswordVisibility(regPasswordField01, regCheckVsbBtn01, showPassword, blockPassword);
});

//-------------------------------Function to look Password in second input field----------------------------------------------
const regPasswordField02 = document.getElementById('newPassword02');
const regCheckVsbBtn02 = document.querySelector('.password_visibility_btn_02');
regCheckVsbBtn02.addEventListener('click', () => {
    const showPassword = "url('/img/opened-Eyes.png')";
    const blockPassword = "url('/img/closed-Eyes.png')";
    authFunctions.controllPasswordVisibility(regPasswordField02, regCheckVsbBtn02, showPassword, blockPassword);
});

