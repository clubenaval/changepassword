# Active Directory Self-Service Password (AD-SSP) via WinRM

Um portal de autoatendimento leve, responsivo e seguro para alteração e consulta de validade de senhas do Active Directory. 

Diferente de soluções tradicionais que exigem a instalação da função de Autoridade Certificadora (AD CS) e a liberação da porta 636 (LDAPS) no Domain Controller, este projeto adota uma arquitetura híbrida: utiliza **LDAP padrão (389)** apenas para validação de credenciais e **WinRM (PowerShell Remoto)** para a injeção segura da nova senha, mantendo a integridade do seu servidor Windows intacta.

## 🚀 Principais Funcionalidades

* **Consulta de Validade:** Os usuários podem verificar quantos dias faltam para a expiração de suas senhas, consultando o atributo nativo `msDS-UserPasswordExpiryTimeComputed`.
* **Alteração de Senha Segura:** Troca de senhas via scripts PowerShell executados remotamente, garantindo que as políticas de complexidade da GPO do domínio sejam respeitadas.
* **Validação em Tempo Real (Frontend):** Checklist visual (letras, números, tamanho, caracteres especiais) que impede o envio do formulário se a senha não atender aos requisitos.
* **Interface Moderna:** Design baseado em abas (Tabs), limpo e responsivo, com botões dinâmicos que evitam o duplo clique durante o processamento (feedback "Aguarde...").
* **Totalmente Conteinerizado:** Pronto para deploy rápido via Docker e Portainer.

---

## 🏗️ Arquitetura de Comunicação

1. **Validação (Bind):** O backend em Flask se conecta à porta `389` do AD. Se a senha atual fornecida pelo usuário estiver correta, a conexão é bem-sucedida.
2. **Criptografia em Trânsito:** A nova senha é convertida em Base64 pelo Python.
3. **Execução (WinRM):** O Python abre uma sessão NTLM na porta `5985` (ou `5986`) do Windows Server usando uma conta de serviço e injeta o comando `Set-ADAccountPassword`, que decodifica o Base64 localmente e aplica a nova senha.

---

## ⚙️ Pré-requisitos e Configuração do Windows Server

Para que o container Linux consiga enviar comandos para o Windows Server, o **Gerenciamento Remoto do Windows (WinRM)** precisa estar habilitado e configurado no servidor que servirá de ponte (pode ser o próprio Domain Controller ou um servidor membro do domínio).

Abra o **PowerShell como Administrador** no Windows Server e execute os seguintes comandos:

1. **Habilitar o WinRM:**
   ```powershell
   Enable-PSRemoting -Force
    ```

2. **Liberar conexões NTLM de hosts não pertencentes ao domínio (como o seu container Docker):**
*Atenção: Para maior segurança em produção, substitua o `*` pelo IP da sua máquina Docker.*

```powershell
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force

```
3. **Reiniciar o serviço para aplicar as regras:**
```powershell
Restart-Service WinRM

```



> **Nota sobre o Usuário de Serviço:** O usuário configurado na variável `WINRM_USER` precisa ter privilégios para alterar senhas de outros usuários no AD. Em um ambiente de testes, um Domain Admin funciona perfeitamente. Em produção, recomenda-se criar uma conta de serviço com privilégios delegados apenas para *Reset Password* nas OUs desejadas.

---

## 🐳 Deploy com Docker Compose (Portainer)

Este projeto foi desenhado para ser executado via Docker. Você não precisa de um arquivo `.env` separado; todas as configurações são injetadas diretamente via `docker-compose.yml`.

1. Clone o repositório:
```bash
git clone [https://github.com/SEU_USUARIO/ad-self-service-password.git](https://github.com/SEU_USUARIO/ad-self-service-password.git)
cd ad-self-service-password

```


2. Edite o arquivo `docker-compose.yml` e ajuste as variáveis de ambiente com os dados da sua infraestrutura:
```yaml
services:
  ad-password-reset:
    build: .
    container_name: ad-password-reset
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - AD_SERVER=dc01.seudominio.local
      - AD_DOMAIN=seudominio.local
      - AD_BASE_DN=DC=seudominio,DC=local
      - WINRM_USER=conta_de_servico@seudominio.local
      - WINRM_PASS=SenhaSuperSegura!
      - FLASK_APP=app.py
      - FLASK_ENV=production
      - SECRET_KEY=Gere_Uma_Chave_Aleatoria_Aqui

```


3. Inicie o container:
```bash
docker compose up -d

```



O portal estará disponível em `http://IP_DO_DOCKER:5000`.

---

## 🛡️ Notas de Segurança

* **Requisitos da GPO:** O sistema no frontend utiliza Regex para simular os requisitos padrões de complexidade da Microsoft. Se a sua *Default Domain Policy* for mais restritiva (ex: mínimo de 12 caracteres), altere a validação no arquivo `static/script.js`.
* **HTTPS/SSL:** Este container expõe a aplicação na porta 5000 via HTTP puro. Para ambientes de produção, **é estritamente recomendado** colocar este container atrás de um proxy reverso (como Nginx Proxy Manager, Traefik ou Cloudflare Tunnels) para fornecer um certificado SSL (HTTPS) válido ao usuário final, protegendo as senhas digitadas no navegador.

---

## 👨‍💻 Autor

**Henrique Fagundes**
Analista de Infraestrutura e Desenvolvedor Open Source.
