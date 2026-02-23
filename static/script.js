// Ícones em SVG
const eyeOpenSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeClosedSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

// Alternar olho da senha
function togglePassword(inputId, iconSpan) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        iconSpan.innerHTML = eyeClosedSVG;
    } else {
        input.type = "password";
        iconSpan.innerHTML = eyeOpenSVG;
    }
}

// Alternar telas do Assistente
function switchView(viewId) {
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializa ícones de olho
    const toggleSpans = document.querySelectorAll('.toggle-password');
    toggleSpans.forEach(span => span.innerHTML = eyeOpenSVG);

    // Variáveis do Passo 1 (Temporárias)
    const usernameTemp = document.getElementById('username_temp');
    const currentPassTemp = document.getElementById('current_password_temp');
    const btnNextStep1 = document.getElementById('btn-next-step1');

    // Variáveis do Passo 2 (Formulário Real)
    const usernameAlt = document.getElementById('username_alt');
    const currentPassAlt = document.getElementById('current_password_alt');
    
    // Botão de avançar do Passo 1 para o Passo 2
    if(btnNextStep1) {
        btnNextStep1.addEventListener('click', function() {
            if (usernameTemp.value.trim() === '' || currentPassTemp.value === '') {
                alert("Por favor, preencha o seu Usuário e a sua Senha Atual para continuar.");
                return;
            }
            // Copia os dados para os inputs escondidos do form real
            usernameAlt.value = usernameTemp.value;
            currentPassAlt.value = currentPassTemp.value;
            
            // Força validação imediata baseada no usuário recém-copiado
            validatePasswords();
            
            // Vai para a próxima tela
            switchView('view-change-step2');
        });
    }

    // Elementos de Validação de Senha (Passo 2)
    const newPassword = document.getElementById('new_password');
    const confirmPassword = document.getElementById('confirm_password');
    const submitBtnAlterar = document.getElementById('btn-final-submit');
    const formAlterar = document.getElementById('passwordForm');

    const reqLength = document.getElementById('req-length');
    const reqUpperLower = document.getElementById('req-upper-lower');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
    const reqUser = document.getElementById('req-user');

    function updateRequirement(element, isValid) {
        if (isValid) {
            element.classList.remove('invalid');
            element.classList.add('valid');
            element.querySelector('span').innerText = '✓';
        } else {
            element.classList.remove('valid');
            element.classList.add('invalid');
            element.querySelector('span').innerText = '✕';
        }
    }

    function validatePasswords() {
        if(!newPassword) return;
        const pass = newPassword.value;
        const confirmPass = confirmPassword.value;
        
        let userRaw = usernameAlt.value.toLowerCase().trim();
        if (userRaw.includes('@')) userRaw = userRaw.split('@')[0];
        if (userRaw.includes('\\')) userRaw = userRaw.split('\\').pop();
        
        let isComplex = true;

        const hasLength = pass.length >= 8;
        updateRequirement(reqLength, hasLength);
        if(!hasLength) isComplex = false;

        const hasUpperLower = /[a-z]/.test(pass) && /[A-Z]/.test(pass);
        updateRequirement(reqUpperLower, hasUpperLower);
        if(!hasUpperLower) isComplex = false;

        const hasNumber = /\d/.test(pass);
        updateRequirement(reqNumber, hasNumber);
        if(!hasNumber) isComplex = false;

        const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(pass);
        updateRequirement(reqSpecial, hasSpecial);
        if(!hasSpecial) isComplex = false;

        let userCheckPass = true;
        if (userRaw.length > 2 && pass.toLowerCase().includes(userRaw)) {
            userCheckPass = false;
        }
        updateRequirement(reqUser, userCheckPass);
        if(!userCheckPass) isComplex = false;

        let passwordsMatch = false;
        if (confirmPass.length > 0) {
            if (pass !== confirmPass) {
                confirmPassword.style.borderColor = '#d32f2f';
                confirmPassword.style.backgroundColor = '#ffebee';
            } else {
                confirmPassword.style.borderColor = '#2e7d32';
                confirmPassword.style.backgroundColor = '#e8f5e9';
                passwordsMatch = true;
            }
        } else {
            confirmPassword.style.borderColor = '#ddd';
            confirmPassword.style.backgroundColor = '#fff';
        }

        if (isComplex && passwordsMatch) {
            submitBtnAlterar.disabled = false;
            submitBtnAlterar.style.opacity = '1';
            submitBtnAlterar.style.cursor = 'pointer';
        } else {
            submitBtnAlterar.disabled = true;
            submitBtnAlterar.style.opacity = '0.5';
            submitBtnAlterar.style.cursor = 'not-allowed';
        }
        
        return isComplex && passwordsMatch;
    }

    if (newPassword && confirmPassword) {
        newPassword.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
    }

    if (formAlterar) {
        formAlterar.addEventListener('submit', function(e) {
            if (!validatePasswords()) {
                e.preventDefault();
                alert('Atenção: A nova senha ainda não atende as regras. Verifique a lista.');
            } else {
                submitBtnAlterar.disabled = true;
                submitBtnAlterar.innerHTML = "Aguarde, processando... ⏳";
                submitBtnAlterar.style.opacity = "0.7";
                submitBtnAlterar.style.cursor = "not-allowed";
            }
        });
    }

    const formConsultar = document.getElementById('formConsultar');
    if (formConsultar) {
        const submitBtnConsultar = formConsultar.querySelector('.btn-submit');
        formConsultar.addEventListener('submit', function(e) {
            submitBtnConsultar.disabled = true;
            submitBtnConsultar.innerHTML = "Aguarde, processando... ⏳";
            submitBtnConsultar.style.opacity = "0.7";
            submitBtnConsultar.style.cursor = "not-allowed";
        });
    }
});