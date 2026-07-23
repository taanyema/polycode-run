import base64
import os
import re
import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

@app.route("/run", methods=["POST"])
def run_code():
    data = request.json or {}
    script = data.get("script", "")
    language = data.get("language")
    user_stdin = data.get("stdin", "")

    output = ""
    image_base64 = None

    try:
        if language == "octave":
            # Détecter si le code contient des commandes de tracé graphique
            has_plot = bool(re.search(r'\b(plot|fplot|bar|hist|scatter|contour|surf|mesh|stem|ezplot)\b', script, re.IGNORECASE))
            
            if has_plot:
                # On redirige le rendu brut vers /dev/null pour bloquer le texte ASCII sans message d'erreur
                wrapped_code = f"""
more off;
warning('off', 'all');
graphics_toolkit("gnuplot");

{script}

try
    hold on;
    grid on;
    set(gca, 'GridLineStyle', '-', 'GridColor', [0.8 0.8 0.8]);
    set(gcf, 'color', 'w');
    
    lims = axis();
    plot([lims(1), lims(2)], [0, 0], 'k-', 'LineWidth', 1, 'HandleVisibility', 'off');
    plot([0, 0], [lims(3), lims(4)], 'k-', 'LineWidth', 1, 'HandleVisibility', 'off');
    
    print('/tmp/output_plot.png', '-dpng', '-r150');
    close all;
catch
end_try_catch
"""
            else:
                # Mode 100% Texte
                wrapped_code = f"""
more off;
warning('off', 'all');
close all;

{script}
"""

            script_path = "/tmp/script_octave.m"
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(wrapped_code)

            # Execution Octave
            result = subprocess.run(
                ["octave-cli", "--no-gui", "--silent", script_path],
                input=user_stdin,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Nettoyage strict de stdout / stderr
            raw_out = result.stdout + result.stderr
            clean_lines = []
            ascii_chars = ("|", "+", "-", "*", "$", "%")
            
            for line in raw_out.splitlines():
                stripped = line.strip()
                # Filtrer les avertissements gnuplot, GUI et graphiques ASCII
                if not any(k in line for k in ["disabling GUI", "X11", "#####", "terminal set to", "No output will be generated"]):
                    if not (has_plot and stripped.startswith(ascii_chars)):
                        clean_lines.append(line)
                    
            output = "\n".join(clean_lines).strip()

            # Traitement de l'image PNG
            image_path = "/tmp/output_plot.png"
            if has_plot and os.path.exists(image_path):
                with open(image_path, "rb") as img_file:
                    image_base64 = base64.b64encode(img_file.read()).decode("utf-8")
                os.remove(image_path)

        elif language == "python3":
            script_path = "/tmp/script.py"
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(script)

            result = subprocess.run(
                ["python3", script_path],
                input=user_stdin,
                capture_output=True,
                text=True,
                timeout=10
            )
            output = result.stdout + result.stderr

        elif language == "c":
            c_path = "/tmp/main.c"
            exe_path = "/tmp/main_c"
            with open(c_path, "w", encoding="utf-8") as f:
                f.write(script)

            compile_res = subprocess.run(["gcc", c_path, "-o", exe_path, "-lm"], capture_output=True, text=True)
            if compile_res.returncode != 0:
                output = "Erreur de compilation :\n" + compile_res.stderr
            else:
                run_res = subprocess.run([exe_path], input=user_stdin, capture_output=True, text=True, timeout=10)
                output = run_res.stdout + run_res.stderr

        elif language == "cpp":
            cpp_path = "/tmp/main.cpp"
            exe_path = "/tmp/main_cpp"
            with open(cpp_path, "w", encoding="utf-8") as f:
                f.write(script)

            compile_res = subprocess.run(["g++", cpp_path, "-o", exe_path], capture_output=True, text=True)
            if compile_res.returncode != 0:
                output = "Erreur de compilation :\n" + compile_res.stderr
            else:
                run_res = subprocess.run([exe_path], input=user_stdin, capture_output=True, text=True, timeout=10)
                output = run_res.stdout + run_res.stderr

        elif language == "java":
            java_path = "/tmp/Main.java"
            with open(java_path, "w", encoding="utf-8") as f:
                f.write(script)

            compile_res = subprocess.run(["javac", java_path], capture_output=True, text=True)
            if compile_res.returncode != 0:
                output = "Erreur de compilation :\n" + compile_res.stderr
            else:
                run_res = subprocess.run(["java", "-cp", "/tmp", "Main"], input=user_stdin, capture_output=True, text=True, timeout=10)
                output = run_res.stdout + run_res.stderr

        else:
            output = "Langage non pris en charge."

        return jsonify({"output": output, "image": image_base64})

    except subprocess.TimeoutExpired:
        return jsonify({"output": "Erreur : Temps d'exécution dépassé (Timeout de 10s).", "image": None})
    except Exception as e:
        return jsonify({"output": f"Erreur serveur : {str(e)}", "image": None})

@app.route("/ai", methods=["POST"])
def ai_help():
    data = request.json or {}
    code = data.get("code", "")
    q = data.get("question", "")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": f"Code:\n{code}\n\nQuestion: {q}\nRéponds brièvement en français."}]
        }]
    }

    try:
        import requests
        res = requests.post(url, json=payload, timeout=10)
        d = res.json()
        text = d.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Pas de réponse claire.")
        return jsonify({"response": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)