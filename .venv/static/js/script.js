let cart = [];
var modal = document.getElementById("itemModal");

// --- MODAL LOGIC ---
function openModal(itemName, itemPrice, itemId, itemCategory) {
    document.getElementById("modal-title").innerText = itemName;
    document.getElementById("modal-item-id").value = itemId; 
    document.getElementById("modal-base-price").value = itemPrice;
    document.getElementById("modal-item-category").value = itemCategory; // Save category
    document.getElementById("modal-qty").value = 1; 
    
    let basePrice = parseFloat(itemPrice);
    const extrasDiv = document.getElementById("modal-extras");

    // Check if the item is a main meal. If so, show the extra options!
    if (itemCategory === 'Rice Meal' || itemCategory === 'Bundles') {
        extrasDiv.style.display = "block"; // Show variations
        document.getElementById("label-price-solo").innerText = "₱" + basePrice.toFixed(2);
        document.getElementById("label-price-drink").innerText = "₱" + (basePrice + 10).toFixed(2);
        document.querySelector('input[name="variation"][value="Solo"]').checked = true;
        document.querySelector('input[name="drink"][value="Iced Gulaman"]').checked = true;
        document.querySelectorAll('.addon-cb').forEach(cb => cb.checked = false);
    } else {
        // If it's a Drink, Side, Dessert, etc., hide all the extra combo stuff!
        extrasDiv.style.display = "none";
    }

    calculateModalTotal(); 
    modal.style.display = "block";
}

function calculateModalTotal() {
    let basePrice = parseFloat(document.getElementById("modal-base-price").value);
    let qty = parseInt(document.getElementById("modal-qty").value);
    let category = document.getElementById("modal-item-category").value;
    let totalItemPrice = basePrice;

    // Only calculate combo math if the item is actually a meal
    if (category === 'Rice Meal' || category === 'Bundles') {
        let variation = document.querySelector('input[name="variation"]:checked').value;
        let drinkSection = document.getElementById("drink-section");

        if (variation === "With Drink") { 
            totalItemPrice += 10; 
            drinkSection.style.opacity = "1";
            drinkSection.style.pointerEvents = "auto";
        } else {
            drinkSection.style.opacity = "0.4";
            drinkSection.style.pointerEvents = "none";
        }

        document.querySelectorAll('.addon-cb:checked').forEach(cb => {
            totalItemPrice += parseFloat(cb.getAttribute("data-price"));
        });
    }

    let finalTotal = totalItemPrice * qty;
    document.getElementById("modal-add-btn").innerText = "Add to Cart - ₱" + finalTotal.toFixed(2);
    modal.dataset.calculatedUnitPrice = totalItemPrice; 
}

// --- CART LOGIC ---
function addToCart() {
    const id = document.getElementById("modal-item-id").value;
    const name = document.getElementById("modal-title").innerText;
    const qty = parseInt(document.getElementById("modal-qty").value);
    const unitPrice = parseFloat(modal.dataset.calculatedUnitPrice);
    const category = document.getElementById("modal-item-category").value;

    let extraText = "";

    // Only pull text from the radio buttons if it's a main meal
    if (category === 'Rice Meal' || category === 'Bundles') {
        const variation = document.querySelector('input[name="variation"]:checked').value;
        extraText = `[${variation}]`;
        
        if (variation === "With Drink") {
            const drink = document.querySelector('input[name="drink"]:checked').value;
            extraText += ` (${drink})`;
        }

        let addons = [];
        document.querySelectorAll('.addon-cb:checked').forEach(cb => {
            addons.push(cb.value);
        });
        if (addons.length > 0) {
            extraText += `<br>+ ${addons.join(", ")}`;
        }
    }

    const cartKey = id + "_" + extraText;
    const existingItem = cart.find(item => item.cartKey === cartKey);
    
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ id: id, cartKey: cartKey, name: name, price: unitPrice, qty: qty, extras: extraText });
    }

    renderCart();
    closeModal();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const cartList = document.getElementById("cart-items");
    const totalDisplay = document.getElementById("cart-total-price");
    
    cartList.innerHTML = ""; 
    let total = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<li style="color: #888; text-align: center; margin-top: 20px;">Cart is empty</li>';
    } else {
        cart.forEach((item, index) => {
            let itemTotal = item.price * item.qty;
            total += itemTotal;

            cartList.innerHTML += `
                <li class="cart-item">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-extras">${item.extras}</div>
                        <div style="color: #4CAF50; font-weight: bold; margin-top: 4px;">₱${item.price.toFixed(2)} x ${item.qty}</div>
                    </div>
                    <div style="font-weight: bold; margin-right: 10px; font-size: 16px;">₱${itemTotal.toFixed(2)}</div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">&times;</button>
                </li>
            `;
        });
    }
    totalDisplay.innerText = total.toFixed(2);
}

// --- FORM SUBMISSION ---
function validateAndSubmitOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty! Please add some items first.");
        return false; 
    }

    const container = document.getElementById("hidden-inputs-container");
    container.innerHTML = ""; 

    cart.forEach(item => {
        container.innerHTML += `<input type="hidden" name="item" value="${item.id}">`;
        container.innerHTML += `<input type="hidden" name="qty" value="${item.qty}">`;
        // NEW: Send the customization details to Flask!
        container.innerHTML += `<input type="hidden" name="details" value="${item.extras}">`;
    });

    return true; 
}

// --- CATEGORY FILTERING LOGIC ---
function filterMenu(categoryName, clickedElement) {
    // 1. Update the active styling on the sidebar
    const listItems = document.querySelectorAll('#category-list li');
    listItems.forEach(li => li.classList.remove('active'));
    clickedElement.classList.add('active');

    // 2. Hide or Show the menu cards
    const cards = document.querySelectorAll('.menu-card');
    cards.forEach(card => {
        // If "All" is clicked, or if the card's category matches the clicked category
        if (categoryName === 'All' || card.getAttribute('data-category') === categoryName) {
            card.style.display = 'block'; // Show it
        } else {
            card.style.display = 'none';  // Hide it
        }
    });
}