// Ícones em SVG
const eyeOpenSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeClosedSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

// Função para exibir o Modal Customizado
function showModal(title, message) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    document.getElementById('customModal').classList.add('active');
}

// Função para fechar o Modal Customizado
function closeModal() {
    document.getElementById('customModal').classList.remove('active');
}

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

    // Elementos do Passo 1
    const usernameTemp = document.getElementById('username_temp');
    const currentPassTemp = document.getElementById('current_password_temp');
    const btnNextStep1 = document.getElementById('btn-next-step1');

    // Elementos do Passo 2
    const usernameAlt = document.getElementById('username_alt');
    const currentPassAlt = document.getElementById('current_password_alt');
    
    // Validação em Tempo Real (AJAX) no botão de avançar
    if(btnNextStep1) {
        btnNextStep1.addEventListener('click', async function() {
            const userVal = usernameTemp.value.trim();
            const passVal = currentPassTemp.value;

            if (userVal === '' || passVal === '') {
                showModal("Dados Incompletos", "Por favor, preencha o seu Usuário e a sua Senha Atual para continuar.");
                return;
            }

            const originalText = btnNextStep1.innerText;
            btnNextStep1.disabled = true;
            btnNextStep1.innerText = "Validando no servidor... ⏳";
            btnNextStep1.style.opacity = "0.7";
            btnNextStep1.style.cursor = "not-allowed";

            try {
                const response = await fetch('/validar_senha_atual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: userVal,
                        current_password: passVal
                    })
                });

                const data = await response.json();

                if (data.sucesso) {
                    usernameAlt.value = userVal;
                    currentPassAlt.value = passVal;
                    validatePasswords(); 
                    switchView('view-change-step2');
                } else {
                    // SUBSTITUÍDO: Chama o Modal Bonito em vez de alert()
                    showModal("Atenção", data.mensagem);
                }
            } catch (error) {
                showModal("Erro de Conexão", "Não foi possível conectar com o servidor. Verifique sua rede e tente novamente.");
                console.error("Erro no fetch:", error);
            } finally {
                btnNextStep1.disabled = false;
                btnNextStep1.innerText = originalText;
                btnNextStep1.style.opacity = "1";
                btnNextStep1.style.cursor = "pointer";
            }
        });
    }

    // Validação da Nova Senha (Passo 2)
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
                showModal("Validação Incompleta", "Por favor, verifique se a nova senha atende a todos os requisitos e se as senhas coincidem.");
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