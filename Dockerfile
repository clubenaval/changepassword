# Usa uma imagem oficial e leve do Python
FROM python:3.11-slim

# Adiciona suporte a versionamento no build (Vem do GitHub Actions)
ARG APP_VERSION=dev-local
ENV APP_VERSION=${APP_VERSION}

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia arquivos do projeto
COPY . .

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt && rm requirements.txt

# Expõe a porta que o Gunicorn vai utilizar
EXPOSE 5000

# Comando para iniciar a aplicação com Gunicorn (4 workers)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]