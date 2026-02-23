// Ícones em SVG para os botões de visualizar senha
const eyeOpenSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeClosedSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

// Função global para alternar a visualização da senha
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

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    tablinks = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    const h2 = document.getElementById('headerTitle');
    const p = document.getElementById('headerDesc');
    if(tabName === 'consultarTab') {
        h2.innerText = "Consultar Validade";
        p.innerText = "Veja quanto tempo falta para sua senha expirar";
    } else {
        h2.innerText = "Atualizar Senha";
        p.innerText = "Mantenha seu acesso seguro";
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializa todos os ícones de olho
    const toggleSpans = document.querySelectorAll('.toggle-password');
    toggleSpans.forEach(span => span.innerHTML = eyeOpenSVG);

    // Elementos do formulário
    const formAlterar = document.getElementById('passwordForm');
    const usernameInput = document.getElementById('username_alt');
    const newPassword = document.getElementById('new_password');
    const confirmPassword = document.getElementById('confirm_password');
    const submitBtnAlterar = formAlterar.querySelector('.btn-submit');

    // Elementos do Checklist
    const reqLength = document.getElementById('req-length');
    const reqUpperLower = document.getElementById('req-upper-lower');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
    const reqUser = document.getElementById('req-user');

    // Função auxiliar para atualizar o status visual de um requisito
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
        const pass = newPassword.value;
        const confirmPass = confirmPassword.value;
        
        // Trata o nome de usuário (ex: tira domínios ou barras se o usuário digitar completo)
        let userRaw = usernameInput.value.toLowerCase().trim();
        if (userRaw.includes('@')) userRaw = userRaw.split('@')[0];
        if (userRaw.includes('\\')) userRaw = userRaw.split('\\').pop();
        
        let isComplex = true;

        // 1. Tamanho (>= 8)
        const hasLength = pass.length >= 8;
        updateRequirement(reqLength, hasLength);
        if(!hasLength) isComplex = false;

        // 2. Letras Maiúsculas e Minúsculas
        const hasUpperLower = /[a-z]/.test(pass) && /[A-Z]/.test(pass);
        updateRequirement(reqUpperLower, hasUpperLower);
        if(!hasUpperLower) isComplex = false;

        // 3. Pelo menos um número
        const hasNumber = /\d/.test(pass);
        updateRequirement(reqNumber, hasNumber);
        if(!hasNumber) isComplex = false;

        // 4. Caractere Especial
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(pass);
        updateRequirement(reqSpecial, hasSpecial);
        if(!hasSpecial) isComplex = false;

        // 5. Não conter o usuário
        // Só fazemos o teste se houver um usuário e uma senha digitada
        let userCheckPass = true;
        if (userRaw.length > 2 && pass.toLowerCase().includes(userRaw)) {
            userCheckPass = false;
        }
        updateRequirement(reqUser, userCheckPass);
        if(!userCheckPass) isComplex = false;

        // 6. Confirmação de Senha
        let passwordsMatch = false;
        if (confirmPass.length > 0) {
            if (pass !== confirmPass) {
                confirmPassword.style.borderColor = '#d32f2f';
            } else {
                confirmPassword.style.borderColor = '#2e7d32';
                passwordsMatch = true;
            }
        } else {
            confirmPassword.style.borderColor = '#ddd';
        }

        // Libera o botão apenas se TUDO for verdadeiro
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

    // Ouve as digitações para avaliar a senha em tempo real
    if (newPassword && confirmPassword && usernameInput) {
        newPassword.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
        usernameInput.addEventListener('input', validatePasswords);
    }

    // Formulário de Alteração
    formAlterar.addEventListener('submit', function(e) {
        if (!validatePasswords()) {
            e.preventDefault();
            alert('Por favor, verifique se a nova senha atende a todos os requisitos e se as senhas coincidem.');
        } else {
            submitBtnAlterar.disabled = true;
            submitBtnAlterar.innerText = "Aguarde...";
            submitBtnAlterar.style.opacity = "0.7";
            submitBtnAlterar.style.cursor = "not-allowed";
        }
    });

    // Formulário de Consulta
    const formConsultar = document.getElementById('formConsultar');
    const submitBtnConsultar = formConsultar.querySelector('.btn-submit');
    formConsultar.addEventListener('submit', function(e) {
        submitBtnConsultar.disabled = true;
        submitBtnConsultar.innerText = "Aguarde...";
        submitBtnConsultar.style.opacity = "0.7";
        submitBtnConsultar.style.cursor = "not-allowed";
    });
});