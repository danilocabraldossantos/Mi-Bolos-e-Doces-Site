/* Carrinho de encomendas MiFischer */
(() => {
    "use strict";

    // IMPORTANTE: troque pelo WhatsApp da loja com código do país e DDD, somente números.
    // Exemplo de formato: 5511999999999
    const WHATSAPP_NUMBER = "5519996524626";
    const STORAGE_KEY = "mifischer_cart_v1";

    // Copia o telefone do rodapé para a área de transferência.
    document.querySelectorAll("[data-copy-phone]").forEach(button => {
        button.addEventListener("click", async () => {
            const phone = button.getAttribute("data-copy-phone") || "";
            let copied = false;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(phone);
                    copied = true;
                } else {
                    const field = document.createElement("textarea");
                    field.value = phone;
                    field.setAttribute("readonly", "");
                    field.style.position = "fixed";
                    field.style.opacity = "0";
                    document.body.appendChild(field);
                    field.select();
                    copied = document.execCommand("copy");
                    field.remove();
                }
            } catch (error) { copied = false; }
            let toast = document.getElementById("mifischerCartToast");
            if (!toast) {
                toast = document.createElement("div");
                toast.id = "mifischerCartToast";
                toast.className = "mifischer-cart-toast";
                toast.setAttribute("role", "status");
                toast.setAttribute("aria-live", "polite");
                document.body.appendChild(toast);
            }
            toast.textContent = copied ? "Telefone copiado!" : "Não foi possível copiar. Selecione o número e copie manualmente.";
            toast.classList.add("is-visible");
            window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
        });
    });


    document.querySelectorAll("[data-whatsapp-contact]").forEach(link => {
        const message = "";
        link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    });

    const readCart = () => {
        try {
            const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    };

    let cart = readCart();
    const money = value => new Intl.NumberFormat("pt-BR", {
        style: "currency", currency: "BRL"
    }).format(value);
    const saveCart = () => sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

    let toastTimer;
    function showCartToast(productName) {
        let toast = document.getElementById("mifischerCartToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "mifischerCartToast";
            toast.className = "mifischer-cart-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.textContent = `Adicionado ao carrinho: ${productName}`;
        toast.classList.add("is-visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
    }

    function renderCart() {
        document.querySelectorAll("[data-cart-count]").forEach(el => {
            el.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        });

        const list = document.querySelector("[data-cart-items]");
        const empty = document.querySelector("[data-cart-empty]");
        const totalEl = document.querySelector("[data-cart-total]");
        if (!list || !empty || !totalEl) return;

        list.innerHTML = "";
        empty.classList.toggle("d-none", cart.length > 0);

        cart.forEach(item => {
            const row = document.createElement("div");
            row.className = "d-flex justify-content-between align-items-center gap-3 py-3 border-bottom";
            const details = document.createElement("div");
            details.className = "flex-grow-1";
            const name = document.createElement("div");
            name.className = "fw-semibold";
            name.textContent = item.name;
            const price = document.createElement("small");
            price.className = "text-muted";
            price.textContent = `${money(item.price)} cada`; 
            details.append(name, price);

            const controls = document.createElement("div");
            controls.className = "d-flex align-items-center gap-2";
            controls.innerHTML = `
                <button type="button" class="btn btn-sm btn-outline-secondary" data-quantity="-1" data-id="${encodeURIComponent(item.id)}" aria-label="Diminuir quantidade">−</button>
                <span class="fw-semibold" aria-live="polite">${item.quantity}</span>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-quantity="1" data-id="${encodeURIComponent(item.id)}" aria-label="Aumentar quantidade">+</button>
                <button type="button" class="btn btn-sm btn-outline-danger" data-remove-item="${encodeURIComponent(item.id)}" aria-label="Remover ${item.name}"><i class="bi-trash"></i></button>`;
            row.append(details, controls);
            list.append(row);
        });

        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        totalEl.textContent = money(total);
        const clearButton = document.querySelector("[data-cart-clear]");
        const whatsappButton = document.querySelector("[data-cart-whatsapp]");
        if (clearButton) clearButton.disabled = cart.length === 0;
        if (whatsappButton) whatsappButton.disabled = cart.length === 0;
    }

    function persistAndRender() {
        saveCart();
        renderCart();
    }

    document.addEventListener("click", event => {
        const addButton = event.target.closest("[data-add-to-cart]");
        if (addButton) {
            const id = addButton.dataset.productId;
            const name = addButton.dataset.productName;
            const price = Number(addButton.dataset.productPrice);
            if (!id || !name || !Number.isFinite(price) || price < 0) return;
            const existing = cart.find(item => item.id === id);
            if (existing) existing.quantity += 1;
            else cart.push({ id, name, price, quantity: 1 });
            persistAndRender();
            showCartToast(name);
            const originalText = addButton.textContent;
            addButton.textContent = "Adicionado!";
            addButton.disabled = true;
            window.setTimeout(() => {
                addButton.textContent = originalText;
                addButton.disabled = false;
            }, 900);
            return;
        }

        const openButton = event.target.closest("[data-cart-open]");
        if (openButton) {
            const modalElement = document.getElementById("cartModal");
            if (modalElement && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modalElement).show();
            return;
        }

        const quantityButton = event.target.closest("[data-quantity]");
        if (quantityButton) {
            const id = decodeURIComponent(quantityButton.dataset.id);
            const item = cart.find(product => product.id === id);
            if (item) {
                item.quantity += Number(quantityButton.dataset.quantity);
                if (item.quantity <= 0) cart = cart.filter(product => product.id !== id);
                persistAndRender();
            }
            return;
        }

        const removeButton = event.target.closest("[data-remove-item]");
        if (removeButton) {
            const id = decodeURIComponent(removeButton.dataset.removeItem);
            cart = cart.filter(item => item.id !== id);
            persistAndRender();
            return;
        }

        if (event.target.closest("[data-cart-clear]")) {
            cart = [];
            persistAndRender();
            return;
        }

        if (event.target.closest("[data-cart-whatsapp]")) {
            if (!cart.length) return;
            if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
                alert("Configure o número de WhatsApp da loja no arquivo js/scripts.js.");
                return;
            }
            const lines = cart.map(item => `• ${item.quantity}x ${item.name} — ${money(item.price * item.quantity)}`);
            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const message = [
                "Olá! Gostaria de fazer uma encomenda:",
                "",
                ...lines,
                "",
                `Total: ${money(total)}`,
                "",
                "Aguardo a confirmação. Obrigado(a)!"
            ].join("\n");
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        }
    });

    renderCart();
})();
