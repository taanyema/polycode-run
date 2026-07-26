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

    try {
        // Appel de ton serveur Flask sur Render (la clé secrète est gérée en toute sécurité côté serveur)
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
        console.log(data);

        if (data.response) {
            messages.innerHTML += `<p class="ai-msg"><b>IA :</b> ${data.response.replace(/\n/g, "<br>")}</p>`;
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
    
    const messages = chatContainer.querySelectorAll('p');
    messages.forEach(msg => {
        const text = msg.innerText;
        if (text.startsWith("Vous :")) {
            markdownContent += `## ${text}\n\n`;
        } else if (text.startsWith("IA :")) {
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
    document.getElementById('btn-envoyer').addEventListener('click', sendMessage);
});