// Lider Portas App Logic
// Novo: o backend Node/SQLite pode fornecer os dados via API.
// O arquivo dados.js ainda contém valores de exemplo usados como fallback.

// Configuração de API (Nuvem Profissional no Render)
const API_URL = 'https://lider-api-servidor.onrender.com';

// Carregar clientes no Select
function loadClientsDropdown() {
    const select = document.getElementById('quickClientSelect');
    select.innerHTML = '<option value="">-- Selecione um Cliente Salvo --</option>';

    clientesDB.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.rotulo}</option>`;
    });
}

function refreshProductDropdowns() {
    const selects = document.querySelectorAll('.prod-select');
    selects.forEach(select => {
        const currentVal = select.value;
        let optionsHtml = '<option value="">-- Selecione ou Digite o Produto --</option>';
        produtosDB.forEach(p => {
            optionsHtml += `<option value="${p.id}" data-price="${p.preco}">${p.nome}</option>`;
        });
        select.innerHTML = optionsHtml;
        if (currentVal) {
            select.value = currentVal;
        }
    });
}

// server CRUD helpers
function fetchProducts() {
    return fetch(`${API_URL}/api/produtos`).then(r => r.json());
}
function fetchClients() {
    return fetch(`${API_URL}/api/clientes`).then(r => r.json());
}

// utility to update status message shown in sidebar
function setSystemStatus(msg, color = '#4CAF50', iconClass = 'fa-check-circle') {
    const statusEl = document.querySelector('.system-status p');
    if (statusEl) {
        statusEl.innerHTML = `<i class="fas ${iconClass}" style="color: ${color};"></i> ${msg}`;
    }
}

// localStorage helpers for offline/mobile mode
function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('Erro ao salvar dados localmente:', e);
    }
}
function loadLocal(key) {
    try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : null;
    } catch (e) {
        console.warn('Erro ao ler dados locais:', e);
        return null;
    }
}

// determine if app should operate in standalone/offline mode
function isStandalone() {
    // Cordova/Capacitor expose global objects; localStorage is always available
    return typeof Capacitor !== 'undefined' || typeof cordova !== 'undefined' || !navigator.onLine;
}

function applyProductEdits() {
    const editor = document.getElementById('prodEditor');
    if (!editor) return;
    try {
        const produtos = JSON.parse(editor.value);

        // always save locally so the mobile/offline build can use it
        saveLocal('produtos', produtos);

        return fetch(`${API_URL}/api/produtos`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({produtos})
        })
        .then(r => {
            if (!r.ok) throw new Error(`status ${r.status}`);
            return r.json();
        })
        .then(data => {
            produtosDB.length = 0;
            data.forEach(p => produtosDB.push(p));
            // also update the local copy with whatever the server returned
            saveLocal('produtos', data);
            editor.value = JSON.stringify(produtosDB, null, 2);
            refreshProductDropdowns();
            setSystemStatus('Produtos Sincronizados', '#4CAF50', 'fa-check-circle');
        })
        .catch(err => {
            console.error(err);
            alert('Não foi possível conectar ao servidor: ' + err.message + ' — dados salvos localmente.');
            setSystemStatus('Sem conexão ao servidor', '#d92332', 'fa-exclamation-circle');
            produtosDB.length = 0;
            produtos.forEach(p => produtosDB.push(p));
            editor.value = JSON.stringify(produtosDB, null, 2);
            refreshProductDropdowns();
        });
    } catch (e) {
        alert('JSON inválido: ' + e.message);
    }
}

function applyClientEdits() {
    const editor = document.getElementById('clientEditor');
    if (!editor) return;
    try {
        const clientes = JSON.parse(editor.value);

        // persist locally regardless of network
        saveLocal('clientes', clientes);

        return fetch(`${API_URL}/api/clientes`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({clientes})
        })
        .then(r => {
            if (!r.ok) throw new Error(`status ${r.status}`);
            return r.json();
        })
        .then(data => {
            clientesDB.length = 0;
            data.forEach(c => clientesDB.push(c));
            loadClientsDropdown();
            // update local copy with returned data
            saveLocal('clientes', data);
            editor.value = JSON.stringify(clientesDB, null, 2);
            setSystemStatus('Clientes Sincronizados', '#4CAF50', 'fa-check-circle');
        })
        .catch(err => {
            console.error(err);
            alert('Não foi possível conectar ao servidor: ' + err.message + ' — dados salvos localmente.');
            setSystemStatus('Sem conexão ao servidor', '#d92332', 'fa-exclamation-circle');
            clientesDB.length = 0;
            clientes.forEach(c => clientesDB.push(c));
            loadClientsDropdown();
            editor.value = JSON.stringify(clientesDB, null, 2);
        });
    } catch (e) {
        alert('JSON inválido: ' + e.message);
    }
}




// preencher textarea de edição com o conteúdo atual das bases
function loadDbEditor() {
    const editor = document.getElementById('dbEditor');
    if (!editor) return;
    const text = `// produtosDB e clientesDB em JSON (faça edições válidas e clique em Atualizar)\n` +
        `produtosDB = ${JSON.stringify(produtosDB, null, 4)};\n` +
        `clientesDB = ${JSON.stringify(clientesDB, null, 4)};`;
    editor.value = text;
}

function applyDbEdits() {
    const editor = document.getElementById('dbEditor');
    if (!editor) return;
    try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(editor.value + '\nreturn {produtosDB, clientesDB};');
        const result = fn();
        if (result.produtosDB && result.clientesDB) {
            produtosDB = result.produtosDB;
            clientesDB = result.clientesDB;
            loadClientsDropdown();
            alert('Cadastro atualizado.');
        } else {
            alert('O texto não definiu as variáveis corretamente.');
        }
    } catch (e) {
        alert('Erro ao aplicar edição: ' + e.message);
    }
}

// toggle editor visibility
function toggleDbEditor() {
    const container = document.getElementById('dbEditorContainer');
    if (container) {
        container.classList.toggle('collapsed');
    }
}

function loadClient() {
    const val = document.getElementById('quickClientSelect').value;
    const client = clientesDB.find(c => c.id === val);

    if (client) {
        document.getElementById('cliName').value = client.nome;
        document.getElementById('cliId').value = client.documento;
        document.getElementById('cliPhone').value = client.telefone;
        document.getElementById('cliAddress').value = client.endereco;
    }
}

// Format Currency BRL
function formatMoney(amount) {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Parse input that might have commas for decimals
function parseMoneyInput(val) {
    if (!val) return 0;
    // Se o usuário digitou no formato R$ ou com vírgula:
    let clean = val.toString().replace('R$', '').trim();
    clean = clean.replace(/\./g, '').replace(',', '.'); // Remove all dots (thousands), change comma to dot
    let num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

// Generate Order Number Sequentially
let currentOrderNumber = 1;

function updateOrderNumber() {
    document.getElementById('ordNum').textContent = String(currentOrderNumber).padStart(5, '0');
}
updateOrderNumber();
// Set Current Date
const today = new Date();
document.getElementById('currentDate').textContent = today.toLocaleDateString('pt-BR');

// Items Management
let rowsCount = 0;

function addItemRow() {
    rowsCount++;
    const tbody = document.getElementById('itemsBody');

    const tr = document.createElement('tr');
    tr.id = `row-${rowsCount}`;

    // Product Options HTML
    let optionsHtml = `<option value="">-- Selecione ou Digite o Produto --</option>`;
    produtosDB.forEach(p => {
        optionsHtml += `<option value="${p.id}" data-price="${p.preco}">${p.nome}</option>`;
    });

    tr.innerHTML = `
        <td class="text-center"><strong>${rowsCount}</strong></td>
        <td>
            <select class="cell-input prod-select" id="prod-${rowsCount}" onchange="handleProductSelect(${rowsCount})">
                ${optionsHtml}
            </select>
        </td>
        <td>
            <!-- QTD Input that Triggers Calculation -->
            <input type="number" class="cell-input text-center" id="qtd-${rowsCount}" value="1" min="1" step="0.01" oninput="calculateRow(${rowsCount})">
        </td>
        <td>
            <!-- Unit Price that Triggers Calculation -->
            <input type="text" class="cell-input text-right" id="val-${rowsCount}" placeholder="R$ 0,00" oninput="calculateRow(${rowsCount})">
        </td>
        <td class="text-right" style="vertical-align: middle;">
            <strong id="tot-${rowsCount}" data-raw="0">R$ 0,00</strong>
        </td>
        <td class="text-center no-print">
            <button class="action-btn" onclick="removeRow(${rowsCount})" title="Remover Item">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;

    tbody.appendChild(tr);
}

function handleProductSelect(rowId) {
    const select = document.getElementById(`prod-${rowId}`);
    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption.value !== "") {
        const price = parseFloat(selectedOption.getAttribute('data-price'));
        // Set unit price visually with two decimals replacing dot with comma
        document.getElementById(`val-${rowId}`).value = price.toFixed(2).replace('.', ',');
    }

    calculateRow(rowId);
}

// FIXED: Now properly multiplies Qtd * Unitary Price
function calculateRow(rowId) {
    const qtdInput = document.getElementById(`qtd-${rowId}`);
    let qtd = parseFloat(qtdInput.value);
    if (isNaN(qtd) || qtd < 0) qtd = 0;

    const rawVal = document.getElementById(`val-${rowId}`).value;
    const val = parseMoneyInput(rawVal);

    // Matemática real: Qtd Brasileira x Valor
    const total = qtd * val;

    const totDisplay = document.getElementById(`tot-${rowId}`);
    totDisplay.textContent = formatMoney(total);
    totDisplay.setAttribute('data-raw', total);

    calculateGrandTotal();
}

function removeRow(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    if (row) {
        row.remove();
        calculateGrandTotal();
    }
}

// FIXED: Discount is now Percentage Based
function calculateGrandTotal() {
    let subtotal = 0;
    const totals = document.querySelectorAll('[id^="tot-"]');

    totals.forEach(t => {
        subtotal += parseFloat(t.getAttribute('data-raw')) || 0;
    });

    document.getElementById('subtotalDisplay').textContent = formatMoney(subtotal);

    // Calcula o Desconto em Porcentagem
    const discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
    const discountMoney = subtotal * (discountPercent / 100);

    document.getElementById('discountMoneyDisplay').textContent = formatMoney(discountMoney);

    const grandTotal = subtotal - discountMoney;
    document.getElementById('grandTotalDisplay').textContent = formatMoney(grandTotal < 0 ? 0 : grandTotal);
}

function clearForm() {
    if (confirm('Tem certeza que deseja apagar todos os dados digitados?')) {
        document.getElementById('itemsBody').innerHTML = '';
        document.getElementById('cliName').value = '';
        document.getElementById('cliId').value = '';
        document.getElementById('cliPhone').value = '';
        document.getElementById('cliAddress').value = '';
        document.getElementById('obs').value = '';
        document.getElementById('discountInput').value = 0;
        document.getElementById('quickClientSelect').value = '';
        currentOrderNumber++;
        updateOrderNumber();
        rowsCount = 0;

        addItemRow();
        addItemRow();
        calculateGrandTotal();
    }
}

function generatePDF() {
    // Atualiza o título do documento para a versão correta antes de gerar/ imprimir
    document.title = 'ORÇAMENTO - LIDER - Portas Automática';

    // Esconder selects e mostrar o texto para o PDF ficar limpo
    const selects = document.querySelectorAll('.prod-select');
    selects.forEach(sel => {
        const text = sel.options[sel.selectedIndex].text;
        sel.setAttribute('data-original-val', sel.value);
        sel.style.display = 'none';

        const span = document.createElement('span');
        span.className = 'print-text-temp doc-input';
        span.textContent = text === "-- Selecione ou Digite o Produto --" ? "" : text;
        sel.parentNode.insertBefore(span, sel);
    });

    const element = document.getElementById('budget-document');

    const opt = {
        margin: 0,
        filename: `Orcamento_Lider_N${document.getElementById('ordNum').textContent}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Restaurar dropdowns após gerar o PDF
        selects.forEach(sel => {
            sel.style.display = 'block';
        });
        document.querySelectorAll('.print-text-temp').forEach(el => el.remove());

        console.log("PDF Gerado com Sucesso!");
    });
}

function shareBudget() {
    const phoneInput = document.getElementById('cliPhone').value.replace(/\D/g, '');
    const clientName = document.getElementById('cliName').value || "Cliente";
    const orderNum = document.getElementById('ordNum').textContent;

    // Preparar PDF
    const selects = document.querySelectorAll('.prod-select');
    selects.forEach(sel => {
        const text = sel.options[sel.selectedIndex].text;
        sel.setAttribute('data-original-val', sel.value);
        sel.style.display = 'none';

        const span = document.createElement('span');
        span.className = 'print-text-temp doc-input';
        span.textContent = text === "-- Selecione ou Digite o Produto --" ? "" : text;
        sel.parentNode.insertBefore(span, sel);
    });

    const element = document.getElementById('budget-document');
    const opt = {
        margin: 0,
        filename: `Orcamento_Lider_N${orderNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Alerta para o usuário saber que está gerando (no iOS pode demorar 2 seg)
    setSystemStatus('Gerando PDF para compartilhar...', '#f39c12', 'fa-spinner fa-spin');

    html2pdf().set(opt).from(element).output('blob').then((blob) => {
        // Restaurar UI
        selects.forEach(sel => {
            sel.style.display = 'block';
        });
        document.querySelectorAll('.print-text-temp').forEach(el => el.remove());
        setSystemStatus('Sistema Online e Pronto', '#4CAF50', 'fa-check-circle');

        const file = new File([blob], opt.filename, { type: 'application/pdf' });

        // Tentar Web Share API
        // IMPORTANTE: No iOS, se mandarmos 'text' e 'files' juntos, o WhatsApp IGNORA o arquivo PDF e manda só o texto.
        // Por isso, mandamos APENAS o arquivo, assim o WhatsApp anexa o PDF perfeitamente!
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: `Orçamento LIDER - ${clientName}`
            }).catch(err => {
                console.warn("Compartilhamento cancelado ou falhou:", err);
                forceDownload(blob, opt.filename);
            });
        } else {
            // Fallback
            forceDownload(blob, opt.filename);
        }
    }).catch(err => {
        alert("Erro ao gerar PDF: " + err);
        setSystemStatus('Erro ao gerar PDF', '#d92332', 'fa-exclamation-circle');
    });
}

function forceDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    alert("O PDF do orçamento foi salvo nos seus arquivos/downloads! Agora você pode enviá-lo pelo WhatsApp como anexo.");
}

// Inicialização
window.onload = async () => {
    // try loading data from backend; fall back to localStorage if unavailable
    let connected = true;
    try {
        const produtos = await fetchProducts();
        produtosDB.length = 0;
        produtos.forEach(p => produtosDB.push(p));
        // keep a local copy
        saveLocal('produtos', produtos);
    } catch (err) {
        console.warn('Não foi possível carregar produtos do servidor:', err);
        connected = false;
        const lp = loadLocal('produtos');
        if (lp) {
            produtosDB.length = 0;
            lp.forEach(p => produtosDB.push(p));
        }
    }

    try {
        const clientes = await fetchClients();
        clientesDB.length = 0;
        clientes.forEach(c => clientesDB.push(c));
        loadClientsDropdown();
        saveLocal('clientes', clientes);
    } catch (err) {
        console.warn('Não foi possível carregar clientes do servidor:', err);
        connected = false;
        const lc = loadLocal('clientes');
        if (lc) {
            clientesDB.length = 0;
            lc.forEach(c => clientesDB.push(c));
            loadClientsDropdown();
        }
    }

    if (!connected) {
        setSystemStatus('Sem conexão ao servidor', '#d92332', 'fa-exclamation-circle');
    }

    // Populate JSON editors
    document.getElementById('prodEditor').value = JSON.stringify(produtosDB, null, 2);
    document.getElementById('clientEditor').value = JSON.stringify(clientesDB, null, 2);

    // sempre inicializar algumas linhas para começar
    addItemRow();
    addItemRow();
    addItemRow();
};

// --- NOVAS FUNÇÕES PARA MODALS DE CADASTRO FÁCIL ---

function toggleJsonEditor() {
    const sec = document.getElementById('jsonEditorSection');
    if (sec.style.display === 'none') {
        sec.style.display = 'block';
    } else {
        sec.style.display = 'none';
    }
}

function openProductModal() {
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
}

function saveNewProduct() {
    const name = document.getElementById('newProdName').value.trim();
    const priceStr = document.getElementById('newProdPrice').value;
    const price = parseFloat(priceStr);

    if (!name || isNaN(price)) {
        alert("Preencha o nome e um preço válido!");
        return;
    }

    // Generate a unique ID
    const newId = Date.now().toString();

    const novoProduto = {
        id: newId,
        nome: name.toUpperCase(),
        preco: price
    };

    // Add to DB
    produtosDB.push(novoProduto);

    // Update JSON Editor
    const editor = document.getElementById('prodEditor');
    if (editor) editor.value = JSON.stringify(produtosDB, null, 2);

    // Trigger save to server
    applyProductEdits();

    closeProductModal();
}

function openClientModal() {
    document.getElementById('clientModal').style.display = 'flex';
}

function closeClientModal() {
    document.getElementById('clientModal').style.display = 'none';
    document.getElementById('newCliId').value = '';
    document.getElementById('newCliLabel').value = '';
    document.getElementById('newCliName').value = '';
    document.getElementById('newCliDoc').value = '';
    document.getElementById('newCliPhone').value = '';
    document.getElementById('newCliAddress').value = '';
}

function saveNewClient() {
    let id = document.getElementById('newCliId').value.trim();
    const label = document.getElementById('newCliLabel').value.trim();
    const name = document.getElementById('newCliName').value.trim();
    const doc = document.getElementById('newCliDoc').value.trim();
    const phone = document.getElementById('newCliPhone').value.trim();
    const address = document.getElementById('newCliAddress').value.trim();

    if (!id || !name) {
        alert("Preencha ao menos o ID (sem espaços) e o Nome/Razão Social!");
        return;
    }
    
    id = id.toLowerCase().replace(/\s+/g, '_');

    const novoCliente = {
        id: id,
        rotulo: label || name,
        nome: name.toUpperCase(),
        documento: doc,
        telefone: phone,
        endereco: address
    };

    clientesDB.push(novoCliente);

    const editor = document.getElementById('clientEditor');
    if (editor) editor.value = JSON.stringify(clientesDB, null, 2);

    applyClientEdits();

    closeClientModal();
}

// --- MOBILE NAVIGATION TOGGLE ---
function showSidebar() {
    document.body.classList.remove('mobile-view-doc');
    document.body.classList.add('mobile-view-menu');
    document.getElementById('btnNavMenu').classList.add('active');
    document.getElementById('btnNavDoc').classList.remove('active');
}

function showDocument() {
    document.body.classList.remove('mobile-view-menu');
    document.body.classList.add('mobile-view-doc');
    document.getElementById('btnNavMenu').classList.remove('active');
    document.getElementById('btnNavDoc').classList.add('active');
}
