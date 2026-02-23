import os
import base64
import winrm
import warnings
from datetime import datetime, timedelta

# Silencia o aviso inofensivo do parser de XML do pywinrm
warnings.filterwarnings("ignore", category=UserWarning, module='winrm')

from flask import Flask, render_template, request, flash, redirect, url_for
from ldap3 import Server, Connection, ALL
from ldap3.core.exceptions import LDAPBindError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'chave-super-secreta-para-sessoes')

AD_SERVER = os.getenv('AD_SERVER')
AD_DOMAIN = os.getenv('AD_DOMAIN')
AD_BASE_DN = os.getenv('AD_BASE_DN')

WINRM_USER = os.getenv('WINRM_USER')
WINRM_PASS = os.getenv('WINRM_PASS')

def ad_timestamp_to_datetime(ad_timestamp):
    """Converte o timestamp do AD (100-nanossegundos desde 1601) para datetime."""
    unix_timestamp = (int(ad_timestamp) / 10000000) - 11644473600
    return datetime.utcfromtimestamp(unix_timestamp)

@app.route('/', methods=['GET', 'POST'])
def index():
    # Por padrão, a aba ativa é a de alterar
    active_tab = 'alterar'

    if request.method == 'POST':
        action = request.form.get('action')
        # Se a ação foi consultar, definimos que a aba ativa na volta será a de consultar
        if action == 'consultar':
            active_tab = 'consultar'
            
        username = request.form.get('username').strip()
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')

        # Formatação de Usuário
        if '@' in username:
            sam_account = username.split('@')[0]
            user_upn = username
        elif '\\' in username:
            sam_account = username.split('\\')[-1]
            user_upn = f"{sam_account}@{AD_DOMAIN}"
        else:
            sam_account = username
            user_upn = f"{sam_account}@{AD_DOMAIN}"

        # ETAPA 1: Autenticação LDAP e Consulta opcional
        try:
            print(f"[*] Validando credenciais LDAP: {user_upn}", flush=True)
            server = Server(AD_SERVER, port=389, get_info=ALL, connect_timeout=5)
            conn = Connection(server, user=user_upn, password=current_password, auto_bind=True)
            
            if action == 'consultar':
                conn.search(
                    search_base=AD_BASE_DN,
                    search_filter=f'(sAMAccountName={sam_account})',
                    attributes=['msDS-UserPasswordExpiryTimeComputed', 'userAccountControl']
                )
                if conn.entries:
                    user_entry = conn.entries[0]
                    uac = user_entry.userAccountControl.value if 'userAccountControl' in user_entry else 0
                    if uac and (uac & 65536):
                        flash('A sua senha está configurada para nunca expirar.', 'success')
                    elif 'msDS-UserPasswordExpiryTimeComputed' in user_entry:
                        ad_expiry_value = user_entry['msDS-UserPasswordExpiryTimeComputed'].value
                        if ad_expiry_value == 0:
                            flash('Sua senha já expirou ou deve ser trocada no próximo logon.', 'error')
                        else:
                            expiry_date = ad_timestamp_to_datetime(ad_expiry_value)
                            dias_restantes = (expiry_date - datetime.utcnow()).days
                            data_br = expiry_date.strftime('%d/%m/%Y')
                            flash(f"Sua senha expira em {dias_restantes} dias ({data_br}).", 'success')
                conn.unbind()
                return render_template('index.html', active_tab=active_tab)

            conn.unbind()

        except LDAPBindError:
            flash('Senha atual incorreta ou usuário inválido.', 'error')
            return render_template('index.html', active_tab=active_tab)
        except Exception as e:
            flash('Erro de comunicação com o servidor AD.', 'error')
            print(f"Erro: {str(e)}", flush=True)
            return render_template('index.html', active_tab=active_tab)

        # ETAPA 2: Alteração de Senha via WinRM
        if action == 'alterar':
            try:
                session = winrm.Session(AD_SERVER, auth=(WINRM_USER, WINRM_PASS), transport='ntlm', server_cert_validation='ignore')
                new_pass_b64 = base64.b64encode(new_password.encode('utf-8')).decode('utf-8')
                ps_script = f"""
                $NewPassB64 = '{new_pass_b64}'
                $NewPass = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($NewPassB64))
                $SecurePass = ConvertTo-SecureString $NewPass -AsPlainText -Force
                Set-ADAccountPassword -Identity '{sam_account}' -NewPassword $SecurePass -Reset:$true
                """
                result = session.run_ps(ps_script)
                if result.status_code == 0:
                    flash('Senha alterada com sucesso!', 'success')
                else:
                    flash('Erro: A senha não atende aos requisitos de complexidade.', 'error')
            except Exception as e:
                flash('Erro interno ao atualizar a senha via WinRM.', 'error')
                print(f"Erro WinRM: {str(e)}", flush=True)

        return render_template('index.html', active_tab=active_tab)

    return render_template('index.html', active_tab=active_tab)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)