export function initCalculator() {
    const modalHTML = `
    <div id="baseCalcModal" class="calc-modal" style="display:none;">
        <div class="calc-content">
            <div class="calc-header">
                <h3>⚡ PolyBase - Convertisseur Avancé</h3>
                <button onclick="fermerCalculatrice()" class="calc-close">✕</button>
            </div>
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
    </div>`;

    if (!document.getElementById('baseCalcModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const convertBases = () => {
        const inputEl = document.getElementById('calcInput');
        const baseEl = document.getElementById('calcBase');
        
        if (!inputEl || !baseEl) return;

        const valStr = inputEl.value.trim();
        const baseStr = parseInt(baseEl.value);

        if (!valStr) {
            document.getElementById('out10').innerText = "-";
            document.getElementById('out2').innerText = "-";
            document.getElementById('out16').innerText = "-";
            document.getElementById('out8').innerText = "-";
            return;
        }

        let decimalValue = parseInt(valStr, baseStr);

        if (isNaN(decimalValue)) {
            document.getElementById('out10').innerText = "Invalide";
            document.getElementById('out2').innerText = "Invalide";
            document.getElementById('out16').innerText = "Invalide";
            document.getElementById('out8').innerText = "Invalide";
            return;
        }

        document.getElementById('out10').innerText = decimalValue.toString(10);
        document.getElementById('out2').innerText = decimalValue.toString(2);
        document.getElementById('out16').innerText = decimalValue.toString(16).toUpperCase();
        document.getElementById('out8').innerText = decimalValue.toString(8);
    };

    window.copierBase = (elementId) => {
        const text = document.getElementById(elementId).innerText;
        if (text && text !== "-" && text !== "Invalide") {
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

        if (inputEl) {
            inputEl.addEventListener('input', convertBases);
            inputEl.addEventListener('keyup', convertBases);
        }
        if (baseEl) {
            baseEl.addEventListener('change', convertBases);
            baseEl.addEventListener('input', convertBases);
        }
    }, 100);
}