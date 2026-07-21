import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Récupération sécurisée depuis les variables d'environnement de Render
JDOODLE_CLIENT_ID = os.environ.get("JDOODLE_CLIENT_ID")
JDOODLE_CLIENT_SECRET = os.environ.get("JDOODLE_CLIENT_SECRET")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


@app.route("/run", methods=["POST"])
def run_code():
  data = request.json
  payload = {
      "clientId": JDOODLE_CLIENT_ID,
      "clientSecret": JDOODLE_CLIENT_SECRET,
      "script": data.get("script"),
      "language": data.get("language"),
      "versionIndex": "0",
      "stdin": data.get("stdin", ""),
  }
  try:
    res = requests.post("https://api.jdoodle.com/v1/execute", json=payload)
    return jsonify(res.json())
  except Exception as e:
    return jsonify({"error": str(e)}), 500


@app.route("/ai", methods=["POST"])
def ai_help():
  data = request.json
  code = data.get("code", "")
  q = data.get("question", "")

  url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
  payload = {
      "contents": [{
          "parts": [{
              "text": (
                  f"Code:\n{code}\n\nQuestion:"
                  f" {q}\nRéponds brièvement en français."
              )
          }]
      }]
  }

  try:
    res = requests.post(url, json=payload)
    d = res.json()
    text = (
        d.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "Pas de réponse claire.")
    )
    return jsonify({"response": text})
  except Exception as e:
    return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000)
