FROM python:3.9-slim

# Installer les compilateurs, Java (JDK), Octave et Gnuplot
RUN apt-get update && apt-get install -y \
    build-existing \
    build-essential \
    default-jdk \
    octave \
    gnuplot \
    && rm -rf /var/lib/apt/lists/*

# Définir le dossier de travail
WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code
COPY . .

# Port et commande de lancement
EXPOSE 5000
CMD ["gunicorn", "b:app", "-b", "0.0.0.0:5000"]