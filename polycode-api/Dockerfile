FROM python:3.9-slim

# Installer les outils nécessaires sans erreur
RUN apt-get update && apt-get install -y \
    build-essential \
    default-jdk \
    octave \
    gnuplot \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:5000"]