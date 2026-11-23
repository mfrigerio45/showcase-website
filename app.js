// INSERISCI QUI IL NOME UTENTE DEL TUO PROFILO INSTAGRAM (senza @)
const INSTAGRAM_USERNAME = "tuo_profilo_instagram";

let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    // Imposta il link Instagram nell'header
    const igUrl = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
    document.getElementById("ig-header-link").href = igUrl;

    // Carica i prodotti dal file JSON
    fetch("prodotti.json")
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            renderProducts();
        })
        .catch(error => {
            console.error("Errore nel caricamento del catalogo:", error);
            document.getElementById("productsGrid").innerHTML = 
                "<p>Impossibile caricare il catalogo al momento.</p>";
        });

    // Event listeners per i filtri
    document.getElementById("categoryFilter").addEventListener("change", renderProducts);
    document.getElementById("sizeFilter").addEventListener("change", renderProducts);
    document.getElementById("styleFilter").addEventListener("change", renderProducts);
    document.getElementById("hideSold").addEventListener("change", renderProducts);

    // Chiusura modale
    const modal = document.getElementById("productModal");
    document.querySelector(".close-modal").addEventListener("click", () => {
        modal.style.display = "none";
    });
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});

function renderProducts() {
    const grid = document.getElementById("productsGrid");
    const category = document.getElementById("categoryFilter").value;
    const size = document.getElementById("sizeFilter").value;
    const style = document.getElementById("styleFilter").value;
    const hideSold = document.getElementById("hideSold").checked;

    grid.innerHTML = "";

    const filtered = allProducts.filter(item => {
        const matchCat = category === "all" || item.category === category;
        const matchSize = size === "all" || item.size === size;
        const matchStyle = style === "all" || (item.tag && item.tag.toLowerCase() === style.toLowerCase());
        const matchSold = !hideSold || !item.sold;
        return matchCat && matchSize && matchStyle && matchSold;
    });

    if (filtered.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #64748b;'>Nessun capo trovato con questi filtri.</p>";
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.onclick = () => openModal(product);

        // --- 1. Gestione automatica "Novità" (basata sulla data) ---
        let novitaBadgeHTML = "";
        if (product.dateAdded) {
            const oggi = new Date();
            const dataInserimento = new Date(product.dateAdded);
            const setteGiorniInMs = 7 * 24 * 60 * 60 * 1000;
            if ((oggi - dataInserimento) < setteGiorniInMs) {
                novitaBadgeHTML = `<span class="style-badge novita">Novità</span>`;
            }
        }
        
        // --- 2. Gestione "Offerta" o "Vintage" (tramite tag) ---
        let styleOrTagBadgeHTML = "";
        if (product.tag) {
            const tagLower = product.tag.toLowerCase();
            if (tagLower === "vintage") {
                styleOrTagBadgeHTML = `<span class="style-badge vintage">Vintage</span>`;
            } else if (tagLower === "offerta") {
                styleOrTagBadgeHTML = `<span class="style-badge offerta">Offerta</span>`;
            }
        }

        // Se il capo è venduto, badge rosso a sinistra, altrimenti vuoto
        const soldBadgeHTML = product.sold ? `<span class="status-badge status-sold">Venduto</span>` : "";

        // --- 3. Gestione del prezzo (normale o scontato con originale barrato) ---
        let priceHTML = "";
        if (product.originalPrice && product.originalPrice > product.price) {
            priceHTML = `
                <div class="card-price offer-price">
                    <span class="original-price">${product.originalPrice} €</span>
                    <span class="current-price">${product.price} €</span>
                </div>
            `;
        } else {
            priceHTML = `<div class="card-price">${product.price} €</div>`;
        }

        card.innerHTML = `
            <div class="card-img-wrapper">
                ${soldBadgeHTML}
                <div class="badges-right-wrapper">
                    ${novitaBadgeHTML}
                    ${styleOrTagBadgeHTML}
                </div>
                <img src="${product.image}" alt="${product.title}" loading="lazy">
            </div>
            <div class="card-info">
                <div class="card-meta">
                    <span>${product.category}</span>
                    <span>Taglia ${product.size} • ${product.condition.split(" ")[0]}</span>
                </div>
                <h3 class="card-title">${product.title}</h3>
                ${priceHTML}
            </div>
        `;

        grid.appendChild(card);
    });
}

function openModal(product) {
    const modal = document.getElementById("productModal");
    
    document.getElementById("modalImg").src = product.image;
    document.getElementById("modalCategory").innerText = product.category;
    document.getElementById("modalTitle").innerText = product.title;
    
    // Gestione prezzo nella modale
    const modalPriceEl = document.getElementById("modalPrice");
    if (product.originalPrice && product.originalPrice > product.price) {
        modalPriceEl.innerHTML = `
            <span class="original-price" style="font-size: 1rem; margin-right: 10px;">${product.originalPrice} €</span>
            <span class="current-price" style="color: var(--sold-red);">${product.price} €</span>
        `;
    } else {
        modalPriceEl.innerText = `${product.price} €`;
    }

    document.getElementById("modalSize").innerText = product.size;
    document.getElementById("modalCondition").innerText = product.condition;
    document.getElementById("modalMeasurements").innerText = product.measurements;
    document.getElementById("modalDescription").innerText = product.description;

    // Gestione dei pulsanti Vinted e Instagram nella modale
    const vintedBtn = document.getElementById("modalVintedBtn");
    const orDivider = document.getElementById("modalOrDivider");
    const igBtn = document.getElementById("modalIgBtn");

    if (product.sold) {
        // Se il capo è venduto
        vintedBtn.style.display = "none";
        orDivider.style.display = "none";
        igBtn.style.pointerEvents = "none";
        igBtn.style.backgroundColor = "#94a3b8";
        igBtn.innerHTML = "Capo già venduto";
        igBtn.href = "#";
    } else {
        // Se il capo è disponibile
        igBtn.style.pointerEvents = "auto";
        igBtn.style.backgroundColor = "var(--anthracite)";
        igBtn.innerHTML = `<i class="fa-brands fa-instagram"></i> Chiedi info / Tratta su Instagram`;
        igBtn.href = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

        // Se il prodotto ha un link Vinted valido, lo mostriamo, altrimenti lo nascondiamo
        if (product.vintedUrl) {
            vintedBtn.style.display = "block";
            orDivider.style.display = "block";
            vintedBtn.href = product.vintedUrl;
        } else {
            vintedBtn.style.display = "none";
            orDivider.style.display = "none";
        }
    }

    modal.style.display = "flex";
}

/* Box con scroll per i dettagli e la descrizione nella modale */
.modal-info-scroll {
    max-height: 140px;
    overflow-y: auto;
    padding-right: 8px;
    margin-bottom: 15px;
}

/* Stile per il pulsante Vinted */
.btn-vinted {
    background-color: #09b1ba; /* Colore ufficiale Vinted */
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    transition: opacity 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-vinted:hover {
    opacity: 0.9;
}

/* Divisore "o" tra i due pulsanti */
.or-divider {
    text-align: center;
    margin: 8px 0;
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-muted);
    text-transform: lowercase;
}
