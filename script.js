import { openAIChat } from './ai-chat/chat.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
console.log("Étape 1");

const firebaseConfig = {
    apiKey: "AIzaSyCAo1mrf8bwHd3rWdmfxzVa_6OabDJIRgw",
    authDomain: "polycode-run.firebaseapp.com",
    projectId: "polycode-run",
    storageBucket: "polycode-run.firebasestorage.app",
    messagingSenderId: "744535546424",
    appId: "1:744535546424:web:0b553f37013f3b6d96e4cd",
    measurementId: "G-DGLXV06MP8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Étape 2");

window.saveUser = async function() {
    const e = document.getElementById('userEmail').value;
    const p = document.getElementById('userPass').value;
    const n = document.getElementById('userName').value;
    try { await createUserWithEmailAndPassword(auth, e, p); localStorage.setItem('polyUser', n); } 
    catch (err) { try { await signInWithEmailAndPassword(auth, e, p); } catch(e2) { alert(e2.message); } }
};

onAuthStateChanged(auth, u => {
    document.getElementById('loginModal').style.display = u ? 'none' : 'flex';
    if(u) document.getElementById('userDisplay').innerText = "👨‍💻 " + (localStorage.getItem('polyUser') || "Développeur");
});

window.deconnexion = () => { if(confirm("Quitter ?")) signOut(auth).then(() => location.reload()); };

// --- CONFIGURATION SÉCURISÉE (Déléguée au serveur Flask) ---
window.gK = () => {
    // La clé n'est plus stockée ici. Elle est cachée sur le serveur Render.
    return "serveur-securise"; 
};

window.envoyerAide = async () => {
    const q = document.getElementById('msgAide').value;
    const code = document.getElementById('editor').value;
    const resZ = document.getElementById('reponseIA');
    
    resZ.style.display = "block"; 
    resZ.innerHTML = "⌛ Analyse via le serveur sécurisé...";
    
    try {
        // Appel de votre propre serveur Flask sur Render (plus de clé Gemini visible ici)
        const res = await fetch("https://polycode-api.onrender.com/ai", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                code: code, 
                question: q 
            })
        });
        
        const d = await res.json();
        
        if (d.response) {
            resZ.innerHTML = d.response.replace(/\n/g, "<br>");
        } else {
            resZ.innerHTML = "⚠️ Erreur : " + (d.error || "Réponse invalide du serveur");
        }
    } catch(e) {
        resZ.innerHTML = "🚨 Erreur de connexion au serveur d'aide IA.";
    }
};

let polyChart = null; 

window.runCode = async () => {
    const fullscreenDiv = document.getElementById('fullscreen-console');
    const out = document.getElementById('fullscreen-output');
    
    fullscreenDiv.style.display = 'block';
    out.innerText = "⏳ Exécution en cours via le serveur sécurisé...";

    const code = document.getElementById('editor').value;
    const inputData = document.getElementById('userInput').value;
    const pLang = document.getElementById('language').value; 

    try {
        // Envoi direct à votre serveur Flask (qui cache les clés JDoodle)
        const response = await fetch("https://polycode-api.onrender.com/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                script: code,
                stdin: inputData,
                language: pLang
            })
        });

        const data = await response.json();

        if (data.output) {
            out.innerText = data.output;
            out.style.color = "#7ee787";
        } else {
            out.innerText = "⚠️ Erreur : " + (data.error || JSON.stringify(data));
            out.style.color = "#f85149";
        }
    } catch (e) {
        out.innerText = "🚨 Erreur de connexion au serveur d'exécution.";
        out.style.color = "#f85149";
    }
};

window.toggleMenu = () => {
    const d = document.getElementById('drawer');
    const o = document.getElementById('drawer-overlay');
    d.classList.toggle('open');
    o.style.display = d.classList.contains('open') ? 'block' : 'none';
};

window.updateColor = () => {
    const editor = document.getElementById("editor");  
    const high = document.getElementById("highlighting-content");  
    let lang = document.getElementById("language").value;  

    if(lang === "python3") lang = "python";  
    if(lang === "octave") lang = "matlab";  

    localStorage.setItem("polycode_backup", editor.value);  

    high.className = "language-" + lang;  
    high.textContent = editor.value;  

    if (window.Prism) {  
        Prism.highlightElement(high);  
    }  
};

// Met à jour les numéros de ligne
window.updateLineNumbers = () => {
    const editor = document.getElementById("editor");  
    const lineBox = document.getElementById("line-numbers");  

    const lines = editor.value.split("\n").length;  
    let numbers = "";  

    for (let i = 1; i <= lines; i++) {  
        numbers += i + "<br>";  
    }  

    lineBox.innerHTML = numbers;  
    
    // Garde la hauteur synchronisée
    syncScroll();
};

// Fonction de synchronisation parfaite du scroll (Acode style)
window.syncScroll = () => {
    const editor = document.getElementById("editor");  
    const high = document.getElementById("highlighting");  
    const lineBox = document.getElementById("line-numbers");  

    if (editor) {
        if (high) {
            high.scrollTop = editor.scrollTop;  
            high.scrollLeft = editor.scrollLeft;  
        }
        if (lineBox) {
            lineBox.scrollTop = editor.scrollTop;  
        }
    }
};

window.insert = (s) => {
    const ed = document.getElementById('editor');
    const start = ed.selectionStart;
    const end = ed.selectionEnd;
    const val = ed.value;
    const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };

    let textToInsert = s;
    let cursorOffset = s.length;

    if (pairs[s]) { 
        textToInsert = s + pairs[s]; 
        cursorOffset = 1; 
    }

    ed.value = val.substring(0, start) + textToInsert + val.substring(end);
    ed.focus();
    ed.setSelectionRange(start + cursorOffset, start + cursorOffset);

    updateColor();
    updateLineNumbers();
};

window.loadTemplate = () => {
    const l = document.getElementById("language").value;
    const t = {  
        python3: 'print("Hello Burkina!")',  
        c: '#include <stdio.h>\n\nint main() {\n    printf("Hello C");\n    return 0;\n}',  
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++";\n    return 0;\n}',  
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}',  
        octave: 'x = 0:0.1:10;\ny = sin(x);\nplot(x,y);'  
    };  

    const editor = document.getElementById("editor");  
    editor.value = t[l] || "";  

    updateColor();  
    updateLineNumbers();  
};

// --- GESTION DE L'INTERFACE ---
let currentTheme = 0;
window.toggleTheme = () => {
    const body = document.body;  
    const prism = document.getElementById("prism-theme");  

    currentTheme++;  
    if(currentTheme > 3) currentTheme = 0;  

    body.classList.remove(  
        "light-mode",  
        "dracula-mode",  
        "midnight-mode"  
    );  

    switch(currentTheme){  
        case 0: // DARK PRO  
            prism.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";  
            break;  
        case 1: // LIGHT  
            body.classList.add("light-mode");  
            prism.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css";  
            break;  
        case 2: // DRACULA  
            body.classList.add("dracula-mode");  
            prism.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css";  
            break;  
        case 3: // MIDNIGHT  
            body.classList.add("midnight-mode");  
            prism.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";  
            break;  
    }  

    updateColor();  
    localStorage.setItem("theme", currentTheme);  
};

window.changeFontSize = (delta) => {
    const editor = document.getElementById("editor");  
    const highlighting = document.getElementById("highlighting");  
    const lineNumbers = document.getElementById("line-numbers");  

    const currentSize = parseFloat(window.getComputedStyle(editor).fontSize);  
    const newSize = Math.max(10, Math.min(25, currentSize + delta));  

    editor.style.fontSize = newSize + "px";  
    highlighting.style.fontSize = newSize + "px";  
    lineNumbers.style.fontSize = newSize + "px";  

    updateColor();  
};

window.copierCode = () => {
    const code = document.getElementById('editor').value;
    navigator.clipboard.writeText(code);
    alert("Code copié dans le presse-papier !");
};

window.clearEditor = () => {
    if(confirm("Voulez-vous vraiment effacer tout le code ?")) {  
        const editor = document.getElementById("editor");  
        editor.value = "";  
        updateColor();  
        updateLineNumbers();  
        editor.focus();  
    }
};

window.toggleStdin = () => {
    const wrapper = document.getElementById("stdin-wrapper");  
    if (!wrapper) {  
        alert("Erreur : stdin-wrapper introuvable");  
        return;  
    }  
    wrapper.style.display = (wrapper.style.display === "block") ? "none" : "block";  
};

window.closeConsole = () => {
    document.getElementById('fullscreen-console').style.display = 'none';
};

window.toggleLanguage = () => {
    const btn = document.getElementById('langBtn');
    if (btn.innerText === "🇫🇷") {
        btn.innerText = "🇬🇧";
        alert("Mode Anglais activé");
    } else {
        btn.innerText = "🇫🇷";
        alert("Mode Français activé");
    }
};

window.ouvrirCalculatrice = () => {
    alert("Ouverture de la calculatrice scientifique...");
    window.open('https://www.google.com/search?q=calculatrice', '_blank');
};

// Exposer les fonctions au DOM
window.runCode = runCode;
window.toggleMenu = toggleMenu;
window.updateColor = updateColor;
window.updateLineNumbers = updateLineNumbers;
window.syncScroll = syncScroll;
window.insert = insert;
window.loadTemplate = loadTemplate;
window.toggleStdin = toggleStdin;
window.toggleTheme = toggleTheme;
window.changeFontSize = changeFontSize;
window.copierCode = copierCode;
window.clearEditor = clearEditor;
window.deconnexion = deconnexion;
window.closeConsole = closeConsole;
window.toggleLanguage = toggleLanguage;
window.ouvrirCalculatrice = ouvrirCalculatrice;
console.log("Étape 3");

// Événement Touche "Entrée" et "Tab" sur l'éditeur
const editor = document.getElementById("editor");

editor.addEventListener("keydown", function(e) {
    if(e.key === "Enter") {
        e.preventDefault();  
        const start = this.selectionStart;  
        const end = this.selectionEnd;  
        const value = this.value;  

        const lineStart = value.lastIndexOf("\n", start - 1) + 1;  
        const currentLine = value.substring(lineStart, start);  
        const indent = currentLine.match(/^\s*/)[0];  

        let extraIndent = "";  
        if(currentLine.trim().endsWith("{")){  
            extraIndent = "    ";  
        }  

        const text = "\n" + indent + extraIndent;  
        this.value = value.substring(0, start) + text + value.substring(end);  
        this.selectionStart = this.selectionEnd = start + text.length;  

        updateColor();  
        updateLineNumbers();  
    }

    if(e.key === "Tab") {
        e.preventDefault();  
        const start = this.selectionStart;  
        const end = this.selectionEnd;  

        this.value = this.value.substring(0, start) + "    " + this.value.substring(end);  
        this.selectionStart = this.selectionEnd = start + 4;  

        updateColor();  
        updateLineNumbers();  
    }
});

// ÉCOUTEURS POUR LE SCROLL ET L'INPUT (Branchés dynamiquement en JS)
editor.addEventListener("scroll", syncScroll);
editor.addEventListener("input", () => {
    updateColor();
    updateLineNumbers();
});

// Initialisation au chargement
window.addEventListener("load", () => {
    const backup = localStorage.getItem("polycode_backup");  
    if (backup) {  
        editor.value = backup;  
    }  

    updateColor();  
    updateLineNumbers();  

    const savedTheme = localStorage.getItem("theme");  
    if(savedTheme !== null){  
        currentTheme = Number(savedTheme) - 1;  
        toggleTheme();  
    }  
});

console.log("SCRIPT CHARGÉ AVEC SCROLL PRO OPTIMISÉ !");
console.log(typeof window.toggleStdin);
// Enregistrement du Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker enregistré !'))
      .catch(err => console.log('Erreur SW:', err));
  });
}