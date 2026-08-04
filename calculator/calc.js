export function initCalculator() {
    const modalHTML = `
    <div id="baseCalcModal" class="calc-modal" style="display:none;">
        <div class="calc-content">
            <div class="calc-header">
                <h3>⚡ PolyBase - Studio de Bases</h3>
                <button onclick="fermerCalculatrice()" class="calc-close">✕</button>
            </div>
            
            <!-- Système d'onglets pour basculer entre Conversion et Calculs -->
            <div class="calc-tabs">
                <button class="tab-btn active" onclick="switchTab('convert')">Conversion</button>
                <button class="tab-btn" onclick="switchTab('arithmetic')">Opérations (+ - × ÷)</button>
            </div>

            <!-- Onglet 1 : Convertisseur -->
            <div id="tab-convert" class="tab-pane active">
                <div class="calc-body">
                    <label for="calcInput">Valeur à convertir :</label>
                    <input type="text" id="calcInput" placeholder="Ex: 255, 1010, FF..." autocomplete="off">
                    
                    <label for="calcBase">Base d'origine :</label>
                    <select id="calcBase">
                        <option value="10">Décimal (Base 10)</option>
                        <option value="2">Binaire (Base 2)</option>
                        <option value="16">Hexadécimal (Base 16)</option>
                        <option value="8">Octal (Base 8)</option>
                    </select>

                    <div class="calc-results">
                        <div class="res-row">
                            <span>Décimal (10) :</span> 
                            <div class="res-action"><strong id="out10">-</strong><button onclick="copierBase('out10')" class="copy-btn">📋</button></div>
                        </div>
                        <div class="res-row">
                            <span>Binaire (2) :</span> 
                            <div class="res-action"><strong id="out2">-</strong><button onclick="copierBase('out2')" class="copy-btn">📋</button></div>
                        </div>
                        <div class="res-row">
                            <span>Hexadécimal (16) :</span> 
                            <div class="res-action"><strong id="out16">-</strong><button onclick="copierBase('out16')" class="copy-btn">📋</button></div>
                        </div>
                        <div class="res-row">
                            <span>Octal (8) :</span> 
                            <div class="res-action"><strong id="out8">-</strong><button onclick="copierBase('out8')" class="copy-btn">📋</button></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Onglet 2 : Opérations Arithmétiques -->
            <div id="tab-arithmetic" class="tab-pane" style="display:none;">
                <div class="calc-body">
                    <label for="opBase">Base de calcul :</label>
                    <select id="opBase">
                        <option value="10">Décimal (Base 10)</option>
                        <option value="2">Binaire (Base 2)</option>
                        <option value="16">Hexadécimal (Base 16)</option>
                        <option value="8">Octal (Base 8)</option>
                    </select>

                    <label for="valA">Nombre A :</label>
                    <input type="text" id="valA" placeholder="Ex: 1010" autocomplete="off">

                    <label for="operator">Opération :</label>
                    <select id="operator">
                        <option value="+">Addition (+)</option>
                        <option value="-">Soustraction (-)</option>
                        <option value="*">Multiplication (×)</option>
                        <option value="/">Division (÷)</option>
                    </select>

                    <label for="valB">Nombre B :</label>
                    <input type="text" id="valB" placeholder="Ex: 11" autocomplete="off">

                    <button onclick="calculerArithmetique()" class="calc-action-btn">Calculer</button>

                    <div class="calc-results" style="margin-top: 15px;">
                        <div class="res-row">
                            <span>Résultat :</span> 
                            <div class="res-action"><strong id="arithResult">-</strong><button onclick="copierBase('arithResult')" class="copy-btn">📋</button></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>`;

    if (!document.getElementById('baseCalcModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Gestion des onglets
    window.switchTab = (tabName) => {
        document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        if (tabName === 'convert') {
            document.getElementById('tab-convert').style.display = 'block';
            event.target.classList.add('active');
        } else {
            document.getElementById('tab-arithmetic').style.display = 'block';
            event.target.classList.add('active');
        }
    };

    // Logique de conversion
    const convertBases = () => {
        const inputEl = document.getElementById('calcInput');
        const baseEl = document.getElementById('calcBase');
        if (!inputEl || !baseEl) return;

        const valStr = inputEl.value.trim();
        const baseStr = parseInt(baseEl.value);

        if (!valStr) {
            ['out10', 'out2', 'out16', 'out8'].forEach(id => document.getElementById(id).innerText = "-");
            return;
        }

        let decimalValue = parseInt(valStr, baseStr);
        if (isNaN(decimalValue)) {
            ['out10', 'out2', 'out16', 'out8'].forEach(id => document.getElementById(id).innerText = "Invalide");
            return;
        }

        document.getElementById('out10').innerText = decimalValue.toString(10);
        document.getElementById('out2').innerText = decimalValue.toString(2);
        document.getElementById('out16').innerText = decimalValue.toString(16).toUpperCase();
        document.getElementById('out8').innerText = decimalValue.toString(8);
    };

    // Logique des opérations arithmétiques inter-bases
    window.calculerArithmetique = () => {
        const base = parseInt(document.getElementById('opBase').value);
        const strA = document.getElementById('valA').value.trim();
        const strB = document.getElementById('valB').value.trim();
        const op = document.getElementById('operator').value;
        const resEl = document.getElementById('arithResult');

        if (!strA || !strB) {
            resEl.innerText = "Entrez A et B";
            return;
        }

        let numA = parseInt(strA, base);
        let numB = parseInt(strB, base);

        if (isNaN(numA) || isNaN(numB)) {
            resEl.innerText = "Erreur de saisie";
            return;
        }

        let result = 0;
        switch (op) {
            case '+': result = numA + numB; break;
            case '-': result = numA - numB; break;
            case '*': result = numA * numB; break;
            case '/': 
                if (numB === 0) {
                    resEl.innerText = "Div/0 impossible";
                    return;
                }
                result = Math.floor(numA / numB); // Division entière souvent utile en bas niveau
                break;
        }

        resEl.innerText = result.toString(base).toUpperCase();
    };

    window.copierBase = (elementId) => {
        const text = document.getElementById(elementId).innerText;
        if (text && text !== "-" && text !== "Invalide" && text !== "Erreur de saisie") {
            navigator.clipboard.writeText(text);
            alert(`Copié : ${text}`);
        }
    };

    window.ouvrirCalculatrice = () => {
        document.getElementById('baseCalcModal').style.display = 'flex';
        document.getElementById('calcInput').focus();
    };

    window.fermerCalculatrice = () => {
        document.getElementById('baseCalcModal').style.display = 'none';
    };

    setTimeout(() => {
        const inputEl = document.getElementById('calcInput');
        const baseEl = document.getElementById('calcBase');
        if (inputEl) inputEl.addEventListener('input', convertBases);
        if (baseEl) baseEl.addEventListener('change', convertBases);
    }, 100);
}