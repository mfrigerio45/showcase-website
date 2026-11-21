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
    document.getElementById("styleFilter").addEventListener("change", renderProducts); // <-- AGGIUNTO QUI
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
        const matchStyle = style === "all" || item.style === style;
        const matchSold = !hideSold || !item.sold;
        return matchCat && matchSize && matchSold;
    });

    if (filtered.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #64748b;'>Nessun capo trovato con questi filtri.</p>";
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.onclick = () => openModal(product);

        // Gestione dello stato (Venduto o Taglia)
        const badgeClass = product.sold ? "status-sold" : "status-available";
        const badgeText = product.sold ? "Venduto" : `Taglia ${product.size}`;

        // --- AGGIUNTA: Logica per i badge "Novità", "Vintage", "Offerta" ---
        let styleBadgeHTML = "";
        if (product.dateAdded) {
            const oggi = new Date();
            const dataInserimento = new Date(product.dateAdded);
            const setteGiorniInMs = 7 * 24 * 60 * 60 * 1000;
            const eUnaNovita = (oggi - dataInserimento) < setteGiorniInMs;

            if (eUnaNovita) {
                styleBadgeHTML = `<span class="style-badge novita">Novità</span>`;
            }
        }
        
        // Se non è novità ma ha un tag specifico (es. vintage o offerta)
        if (!styleBadgeHTML && product.tag) {
            if (product.tag === "vintage") {
                styleBadgeHTML = `<span class="style-badge vintage">Vintage</span>`;
            } else if (product.tag === "offerta") {
                styleBadgeHTML = `<span class="style-badge offerta">Offerta</span>`;
            }
        }
        // -----------------------------------------------------------------

        card.innerHTML = `
            <div class="card-img-wrapper">
                <span class="status-badge ${badgeClass}">${badgeText}</span>
                ${styleBadgeHTML}
                <img src="${product.image}" alt="${product.title}" loading="lazy">
            </div>
            <div class="card-info">
                <div class="card-meta">
                    <span>${product.category}</span>
                    <span>${product.condition.split(" ")[0]}</span>
                </div>
                <h3 class="card-title">${product.title}</h3>
                <div class="card-price">${product.price} €</div>
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
    document.getElementById("modalPrice").innerText = `${product.price} €`;
    document.getElementById("modalSize").innerText = product.size;
    document.getElementById("modalCondition").innerText = product.condition;
    document.getElementById("modalMeasurements").innerText = product.measurements;
    document.getElementById("modalDescription").innerText = product.description;

    const btn = document.getElementById("modalIgBtn");
    if (product.sold) {
        btn.style.pointerEvents = "none";
        btn.style.backgroundColor = "#94a3b8";
        btn.innerHTML = "Capo già venduto";
    } else {
        btn.style.pointerEvents = "auto";
        btn.style.backgroundColor = "var(--anthracite)";
        btn.innerHTML = `<i class="fa-brands fa-instagram"></i> Chiedi info / Tratta su Instagram`;
        btn.href = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
    }

    modal.style.display = "flex";
}
