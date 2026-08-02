// Importation du prompt depuis le fichier séparé
import { SYSTEM_PROMPT } from './prompt.js';

// 1. Fonction pour ouvrir le chatbot dans une NOUVELLE FENÊTRE
export function openAIChat() {
    const width = 400;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    window.open('chat.html', '_blank', `width=${width},height=${height},top=${top},left=${left}`);
}

// Fonction pour afficher proprement le message de l'IA avec Markdown, Coloration et Boutons
function displayAIMessage(rawResponseText) {
    const messagesContainer = document.getElementById('chat-messages');
    
    let messageDiv = document.createElement('div');
    messageDiv.className = "ai-msg";
    
    // Si la fonction globale "marked" est disponible, on l'utilise pour le rendu pro
    if (window.marked) {
        messageDiv.innerHTML = "<b>IA :</b><br>" + window.marked.parse(rawResponseText);
    } else {
        messageDiv.innerHTML = `<b>IA :</b> ${rawResponseText.replace(/\n/g, "<br>")}`;
    }
    
    messagesContainer.appendChild(messageDiv);

    // Appliquer highlight.js et ajouter les boutons sur chaque bloc de code
    if (window.hljs) {
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            window.hljs.highlightElement(block);

            let pre = block.parentElement;
            
            // Créer l'en-tête du bloc de code
            let header = document.createElement('div');
            header.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #21252b; padding: 6px 12px; font-size: 12px; color: #abb2bf; border-top-left-radius: 6px; border-top-right-radius: 6px;";

            let langClass = Array.from(block.classList).find(c => c.startsWith('language-'));
            let langName = langClass ? langClass.replace('language-', '').toUpperCase() : 'CODE';

            let langSpan = document.createElement('span');
            langSpan.innerText = langName;
            header.appendChild(langSpan);

            let btnContainer = document.createElement('div');
            btnContainer.style.cssText = "display: flex; gap: 12px;";

            // Bouton Copier
            let copyBtn = document.createElement('button');
            copyBtn.innerHTML = '📋 Copier';
            copyBtn.style.cssText = "background: transparent; border: none; color: #abb2bf; cursor: pointer; font-size: 12px;";
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(block.innerText);
                copyBtn.innerHTML = '✅ Copié !';
                setTimeout(() => copyBtn.innerHTML = '📋 Copier', 2000);
            };

            // Bouton Enregistrer / Télécharger
            let saveBtn = document.createElement('button');
            saveBtn.innerHTML = '💾 Enregistrer';
            saveBtn.style.cssText = "background: transparent; border: none; color: #abb2bf; cursor: pointer; font-size: 12px;";
            saveBtn.onclick = () => {
                let blob = new Blob([block.innerText], { type: 'text/plain' });
                let a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                let ext = langName.toLowerCase() === 'c' ? 'c' : (langName.toLowerCase() === 'python' ? 'py' : 'txt');
                a.download = `snippet.${ext}`;
                a.click();
            };

            btnContainer.appendChild(copyBtn);
            btnContainer.appendChild(saveBtn);
            header.appendChild(btnContainer);

            pre.style.cssText = "background: #1e1e1e; border-radius: 8px; margin: 12px 0; overflow: hidden; border: 1px solid #3e3e3e;";
            pre.insertBefore(header, block);
        });
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 2. Fonction d'envoi
window.sendMessage = async () => {
    const input = document.getElementById('user-input');
    const messages = document.getElementById('chat-messages');
    
    const code = window.opener ? window.opener.document.getElementById('editor').value : "Code non accessible";
    const userQuery = input.value;

    if (!userQuery.trim()) return;

    // Affichage message utilisateur
    messages.innerHTML += `<p class="user-msg"><b>Vous :</b> ${userQuery}</p>`;
    input.value = "";

    // Indicateur de chargement
    messages.innerHTML += `<p id="loading" class="ai-msg"><i>⏳ Analyse en cours...</i></p>`;
    messages.scrollTop = messages.scrollHeight;

    try {
        const response = await fetch("https://polycode-api.onrender.com/ai", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                question: userQuery,
                system_prompt: SYSTEM_PROMPT
            })
        });

        const data = await response.json();
        
        // Suppression du chargement
        const loader = document.getElementById('loading');
        if (loader) loader.remove();

        if (data.response) {
            displayAIMessage(data.response);
        } else {
            messages.innerHTML += `<p style="color:#f85149;">Erreur : ${data.error || "Réponse invalide du serveur"}</p>`;
        }
        
        messages.scrollTop = messages.scrollHeight;

    } catch (e) {
        const loader = document.getElementById('loading');
        if (loader) loader.remove();
        messages.innerHTML += `<p style="color:#f85149;">Erreur : Impossible de contacter le serveur d'aide IA.</p>`;
    }
};

// Fonction pour fermer la fenêtre
window.closeAIChat = () => {
    window.close();
};

// 3. Fonction pour exporter la conversation en Markdown
window.exportChatToMarkdown = () => {
    const chatContainer = document.getElementById('chat-messages');
    let markdownContent = "# Journal de bord - PolyCode Pro\n\n";
    
    const messages = chatContainer.querySelectorAll('p, div.ai-msg');
    messages.forEach(msg => {
        const text = msg.innerText;
        if (text.startsWith("Vous :")) {
            markdownContent += `## ${text}\n\n`;
        } else if (text.includes("IA :")) {
            markdownContent += `> ${text}\n\n---\n`;
        }
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
};

window.openAIChat = openAIChat;

document.addEventListener('DOMContentLoaded', () => {
    const btnEnvoyer = document.getElementById('btn-envoyer');
    if (btnEnvoyer) {
        btnEnvoyer.addEventListener('click', sendMessage);
    }
});