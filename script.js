// --- CENTRAL CONFIGURATION LAYER ---
// ⚠️ MAKE SURE TO PASTE YOUR ACTUAL KEY FROM THE SPOONACULAR DASHBOARD HERE:
const SPOONACULAR_API_KEY = "d015554146f2421f9be6844c9ec763a3"; 

// --- LOCAL FAIL-SAFE BACKUP DATA ---
// If the API fails, runs out of points, or is slow, this fallback array automatically saves your layout!
const fallbackHomeRecipes = [
    {
        id: 1,
        title: "Grilled Lemon Herb Chicken",
        time: 25,
        calories: 340,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&auto=format&fit=crop",
        description: "Juicy, tender grilled chicken breasts marinated in crisp lemon citrus, fresh rosemary, and garlic."
    },
    {
        id: 2,
        title: "Classic Margherita Pizza",
        time: 20,
        calories: 580,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&auto=format&fit=crop",
        description: "An authentic Italian flatbread topped with rich San Marzano tomato sauce, fresh mozzarella bubbles, and fragrant basil leaves."
    },
    {
        id: 3,
        title: "Vegan Buddha Bowl",
        time: 20,
        calories: 310,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop",
        description: "A colorful, vibrant balance of warm quinoa, roasted sweet potatoes, crispy chickpeas, and tahini drizzle."
    }
];

// --- DATABASE LAYER: INITIALIZE OR RESTORE FROM LOCALSTORAGE ---
function getSavedPlannerSchedule() {
    const saved = localStorage.getItem('cp_planner_schedule');
    if (saved) return JSON.parse(saved);
    return {
        "monday-breakfast": null, "monday-lunch": null, "monday-dinner": null,
        "tuesday-breakfast": null, "tuesday-lunch": null, "tuesday-dinner": null,
        "wednesday-breakfast": null, "wednesday-lunch": null, "wednesday-dinner": null
    };
}

let activePlannerSchedule = getSavedPlannerSchedule();

// --- AUTOMATED SHOPPING LIST CALCULATOR AGGREGATOR ---
function calculateAggregatedGroceries() {
    const listContainer = document.getElementById('grocery-list-target');
    if (!listContainer) return; 

    let masterIngredientsMap = {};

    Object.values(activePlannerSchedule).forEach(recipeProfile => {
        if (!recipeProfile) return;
        recipeProfile.extendedIngredients.forEach(ingredient => {
            const name = ingredient.name.toLowerCase().trim();
            const aisle = ingredient.aisle ? ingredient.aisle.trim() : "General Pantry";
            const amount = ingredient.measures.metric.amount;
            const unit = ingredient.measures.metric.unitShort.toLowerCase();

            if (!masterIngredientsMap[aisle]) masterIngredientsMap[aisle] = {};
            if (masterIngredientsMap[aisle][name]) {
                masterIngredientsMap[aisle][name].amount += amount;
            } else {
                masterIngredientsMap[aisle][name] = { amount, unit };
            }
        });
    });

    const aislesArray = Object.keys(masterIngredientsMap);
    if (aislesArray.length === 0) {
        listContainer.innerHTML = `<p class="empty-list-text">Your schedule is empty. Add recipes to generate an automated shopping list!</p>`;
        return;
    }

    listContainer.innerHTML = aislesArray.map(aisleName => `
        <div class="grocery-aisle-section">
            <h4>${aisleName}</h4>
            ${Object.keys(masterIngredientsMap[aisleName]).map(ingName => {
                const item = masterIngredientsMap[aisleName][ingName];
                const roundedAmount = Math.round(item.amount * 10) / 10;
                return `
                    <label class="grocery-item-checkbox">
                        <input type="checkbox">
                        <span class="item-name-text"><strong style="text-transform: capitalize;">${ingName}</strong>: ${roundedAmount} ${item.unit}</span>
                    </label>
                `;
            }).join('')}
        </div>
    `).join('');
}

// --- DYNAMIC PLANNER ACTION CONTROLLERS ---
async function assignRecipeToPlannerSlot(day, mealType, recipeId) {
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        activePlannerSchedule[`${day}-${mealType}`] = data;
        localStorage.setItem('cp_planner_schedule', JSON.stringify(activePlannerSchedule));
        alert(`Success! Added to your ${day} ${mealType} menu. Redirecting back to your planner...`);
        window.location.href = 'meal-plans.html';
    } catch (e) {
        console.error("Failed fetching recipe details.", e);
        alert("Unable to reach cloud network nodes to append choice.");
    }
}

function removeRecipeFromPlannerSlot(day, mealType, event) {
    event.stopPropagation(); 
    activePlannerSchedule[`${day}-${mealType}`] = null;
    localStorage.setItem('cp_planner_schedule', JSON.stringify(activePlannerSchedule));
    renderPlannerUIState();
    calculateAggregatedGroceries();
}

function renderPlannerUIState() {
    document.querySelectorAll('.meal-slot').forEach(slot => {
        const day = slot.closest('.day-card').dataset.day;
        const meal = slot.dataset.meal;
        const contentBox = slot.querySelector('.slot-content');
        const scheduledData = activePlannerSchedule[`${day}-${meal}`];

        if (scheduledData) {
            contentBox.innerHTML = `
                <div class="planned-item-card" onclick="openRecipeDetails(${scheduledData.id})">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">${scheduledData.title}</span>
                    <button class="btn-remove-slot-item" onclick="removeRecipeFromPlannerSlot('${day}', '${meal}', event)">&times;</button>
                </div>
            `;
        } else {
            contentBox.innerHTML = `<button class="btn-add-meal">+ Add Meal</button>`;
            contentBox.querySelector('.btn-add-meal').addEventListener('click', () => {
                window.location.href = 'explore.html';
            });
        }
    });
}

// --- CENTRAL SHARED LAYOUT FACTORIES ---
function buildRecipeCard(id, title, image, readyInMinutes, calories) {
    const displayTime = readyInMinutes ? `${readyInMinutes} mins` : "Quick Prep";
    const displayCalories = calories ? `${Math.round(calories)} kcal` : "Balanced Diet";
    return `
        <div class="recipe-card" onclick="openRecipeDetails(${id})">
            <div class="card-img-container">
                <img src="${image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600'}" alt="${title}">
                <div class="rating-badge"><i class="fa-solid fa-star"></i> 4.5</div>
            </div>
            <div class="card-content">
                <h3>${title}</h3>
                <div class="recipe-meta">
                    <span><i class="fa-regular fa-clock"></i> ${displayTime}</span>
                    <span><i class="fa-solid fa-fire-flame-curved"></i> ${displayCalories}</span>
                </div>
                <p>Click to view full recipe details and instructions.</p>
            </div>
        </div>
    `;
}

// --- FEATURE 1: FRIDGE INGREDIENT SEARCH ENGINE (HOME PAGE) ---
async function performIngredientSearch() {
    const userField = document.getElementById('ingredient-input');
    const resultBox = document.getElementById('ingredient-results-container');
    const displayGrid = document.getElementById('ingredient-recipes-grid');
    if (!userField) return;

    const rawInput = userField.value.trim();
    if (!rawInput) return alert("Please type some ingredients first (e.g., chicken, tomato)!");

    displayGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Analyzing fridge records...</p>`;
    resultBox.classList.remove('hidden');

    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(rawInput)}&number=6&apiKey=${SPOONACULAR_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === "failure" || data.length === 0) throw new Error("API Limit or Empty Response");

        displayGrid.innerHTML = data.map(recipe => `
            <div class="recipe-card" onclick="openRecipeDetails(${recipe.id})">
                <div class="card-img-container"><img src="${recipe.image}"><div class="rating-badge">★ Active</div></div>
                <div class="card-content"><h3>${recipe.title}</h3><p style="font-size:13px; color:var(--text-light); margin-top:5px;">Uses ${recipe.usedIngredientCount} of your items.</p></div>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        displayGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 20px; color: var(--text-light);">No live results found. Make sure your API key is correct or try again later!</p>`;
    }
}

// --- FEATURE 2: MASTER EXPLORE CATALOG SYSTEM ENGINE (EXPLORE PAGE) ---
async function processMasterExploreEngine() {
    const gridTarget = document.getElementById('explore-recipes-grid');
    if (!gridTarget) return;

    let queryInput = document.getElementById('explore-live-search').value.trim();
    
    // --- URL PARAMETER ROUTER ENGAGEMENT ---
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchQuery = urlParams.get('search');
    
    if (urlSearchQuery && !document.getElementById('explore-live-search').dataset.initialized) {
        document.getElementById('explore-live-search').value = urlSearchQuery;
        queryInput = urlSearchQuery;
        document.getElementById('explore-live-search').dataset.initialized = "true";
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    // ----------------------------------------

    const activeSort = document.getElementById('sort-selector').value;
    const vegFilterChecked = document.getElementById('diet-veg-filter').checked;
    const checkedCats = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);

    gridTarget.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i> Fetching records...</p>`;
    let url = `https://api.spoonacular.com/recipes/complexSearch?number=9&addRecipeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`;
    if (queryInput) url += `&query=${encodeURIComponent(queryInput)}`;
    if (vegFilterChecked) url += `&diet=vegetarian`;
    if (checkedCats.length > 0) url += `&type=${checkedCats.join(',')}`;
    
    if (activeSort === "rating-high") url += `&sort=rating&sortDirection=desc`;
    else if (activeSort === "calories-low") url += `&sort=calories&sortDirection=asc`;
    else if (activeSort === "time-low") url += `&sort=time&sortDirection=asc`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const recipes = data.results || [];
        document.getElementById('current-count').innerText = recipes.length;

        if (recipes.length === 0) {
            gridTarget.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px;">No outputs found.</p>`;
            return;
        }
        gridTarget.innerHTML = recipes.map(r => {
            const cal = r.nutrition ? r.nutrition.nutrients.find(n => n.name === "Calories") : null;
            return buildRecipeCard(r.id, r.title, r.image, r.readyInMinutes, cal ? cal.amount : null);
        }).join('');
    } catch (e) {
        console.error(e);
        gridTarget.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:40px; color: var(--text-light);">Unable to fetch live catalog.</p>`;
    }
}

// --- FEATURE 3: DYNAMIC RECIPE INSTRUCTIONS MODAL DRAWER ---
window.openRecipeDetails = async function(recipeId) {
    const canvasTarget = document.getElementById('recipe-detail-content-target');
    if(!canvasTarget) return;
    canvasTarget.innerHTML = `<p style="text-align:center; padding:30px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i> Accessing logs...</p>`;
    document.getElementById('recipe-details-modal').classList.remove('hidden');

    if (recipeId <= 3) {
        const localRecipe = fallbackHomeRecipes.find(r => r.id === recipeId);
        if (localRecipe) {
            canvasTarget.innerHTML = `
                <img src="${localRecipe.image}" class="detail-img">
                <h2>${localRecipe.title}</h2>
                <p style="margin: 15px 0; color: var(--text-light); font-style: italic;">Viewing in fallback mode.</p>
                <div class="detail-section-title">Description</div>
                <p style="line-height:1.6; margin-bottom: 20px;">${localRecipe.description}</p>
                <p style="color: var(--text-light);">Go to the Explore page to open real dynamic step sheets!</p>
            `;
            return;
        }
    }

    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`;
    try {
        const response = await fetch(url);
        const recipe = await response.json();
        canvasTarget.innerHTML = `
            <img src="${recipe.image}" class="detail-img">
            <div class="detail-title-row"><h2>${recipe.title}</h2></div>
            <div style="background-color: #fff3e6; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #ebdcd0;">
                <span style="font-weight:700; font-size:14px; color: var(--text-dark); display:block; margin-bottom:8px;"><i class="fa-solid fa-circle-plus"></i> Add this item to Weekly Planner Schedule:</span>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="btn-auth-submit" style="margin:0; padding:8px 12px; font-size:13px; width:auto;" onclick="assignRecipeToPlannerSlot('monday','lunch', ${recipe.id})">Mon Lunch</button>
                    <button class="btn-auth-submit" style="margin:0; padding:8px 12px; font-size:13px; width:auto;" onclick="assignRecipeToPlannerSlot('monday','dinner', ${recipe.id})">Mon Dinner</button>
                    <button class="btn-auth-submit" style="margin:0; padding:8px 12px; font-size:13px; width:auto; background-color:var(--text-dark);" onclick="assignRecipeToPlannerSlot('tuesday','lunch', ${recipe.id})">Tue Lunch</button>
                    <button class="btn-auth-submit" style="margin:0; padding:8px 12px; font-size:13px; width:auto; background-color:var(--text-dark);" onclick="assignRecipeToPlannerSlot('wednesday','dinner', ${recipe.id})">Wed Dinner</button>
                </div>
            </div>
            <div class="detail-section-title">Required Base Ingredients</div>
            <ul class="detail-ingredients-list">${recipe.extendedIngredients.map(ing => `<li>${ing.original}</li>`).join('')}</ul>
            <div class="detail-section-title">Step-by-Step Cooking Directives</div>
            <ol class="detail-steps-list">${recipe.analyzedInstructions.length > 0 ? recipe.analyzedInstructions[0].steps.map(s => `<li>${s.step}</li>`).join('') : `<li>Assemble and serve.</li>`}</ol>
        `;
    } catch (e) {
        console.error(e);
        canvasTarget.innerHTML = `<p style="text-align:center; color:#e74c3c;">Timeout parsing profile mapping context.</p>`;
    }
};

// --- INITIAL LOAD RE-RENDER ENGINE WITH FAIL-SAFE FALLBACKS ---
async function loadDefaultHomeRecommendations() {
    const homeGrid = document.getElementById('recommendations-grid');
    if (!homeGrid) return; 

    const url = `https://api.spoonacular.com/recipes/random?number=3&apiKey=${SPOONACULAR_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Limit or Request Error");
        const data = await response.json();
        if (!data.recipes || data.recipes.length === 0) throw new Error("Empty Array Error");
        
        homeGrid.innerHTML = data.recipes.map(r => buildRecipeCard(r.id, r.title, r.image, r.readyInMinutes, 450)).join('');
    } catch (e) {
        console.warn("Spoonacular Random API unavailable. Activating local layout fallbacks.", e);
        homeGrid.innerHTML = fallbackHomeRecipes.map(r => buildRecipeCard(r.id, r.title, r.image, r.time, r.calories)).join('');
    }
}

// --- LOCALSTORAGE SESSIONS ---
function getRegisteredUsers() { const users = localStorage.getItem('cp_users'); return users ? JSON.parse(users) : []; }
function closeAllModals() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('signup-modal').classList.add('hidden');
    const detailsView = document.getElementById('recipe-details-modal');
    if (detailsView) detailsView.classList.add('hidden');
    document.getElementById('signup-form').reset(); document.getElementById('login-form').reset();
}

// --- BOOT UP SYSTEM ---
document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-ui-container');
    const activeUser = JSON.parse(localStorage.getItem('cp_active_user'));
    if (activeUser) {
        authContainer.innerHTML = `<div class="user-profile-badge"><span>Welcome, <strong>${activeUser.username}</strong>!</span><button class="btn-logout" id="logout-action-btn">Log Out</button></div>`;
        document.getElementById('logout-action-btn').addEventListener('click', () => { localStorage.removeItem('cp_active_user'); window.location.reload(); });
    } else {
        authContainer.innerHTML = `<button class="btn-login" id="nav-login-btn">Log In</button><button class="btn-signup" id="nav-signup-btn">Sign Up</button>`;
        document.getElementById('nav-login-btn').addEventListener('click', () => document.getElementById('login-modal').classList.remove('hidden'));
        document.getElementById('nav-signup-btn').addEventListener('click', () => document.getElementById('signup-modal').classList.remove('hidden'));
    }

    loadDefaultHomeRecommendations();

    // Global Hero Search Button Logic (CONNECTED & OPERATIONAL)
    const mainSearchBtn = document.getElementById('btn-global-search');
    const mainInputField = document.getElementById('global-search-input');
    if (mainSearchBtn && mainInputField) {
        mainSearchBtn.addEventListener('click', () => {
            const query = mainInputField.value.trim();
            if (query !== "") {
                window.location.href = `explore.html?search=${encodeURIComponent(query)}`;
            } else {
                alert("Please type a dish or ingredient name first!");
            }
        });
        mainInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') mainSearchBtn.click();
        });
    }

    if (document.getElementById('weekly-calendar')) {
        renderPlannerUIState();
        calculateAggregatedGroceries();
        document.getElementById('close-details-btn').addEventListener('click', closeAllModals);
    }
    if (document.getElementById('explore-recipes-grid')) {
        processMasterExploreEngine();
        document.getElementById('explore-live-search').addEventListener('change', processMasterExploreEngine);
        document.getElementById('sort-selector').addEventListener('change', processMasterExploreEngine);
        document.getElementById('diet-veg-filter').addEventListener('change', processMasterExploreEngine);
        document.querySelectorAll('.category-filter').forEach(box => box.addEventListener('change', processMasterExploreEngine));
        document.getElementById('close-details-btn').addEventListener('click', closeAllModals);
    }
    if (document.getElementById('market-listings-grid')) {
        if(typeof renderMarketListings === 'function') {
            renderMarketListings();
            calculateTasteMatchMetrics();
            document.getElementById('market-post-form').addEventListener('submit', handlePostTradeItem);
        }
    }

    const fridgeBtn = document.getElementById('btn-find-by-ingredients');
    if (fridgeBtn) {
        fridgeBtn.addEventListener('click', performIngredientSearch);
        document.getElementById('ingredient-input').addEventListener('keypress', (e) => { if(e.key==='Enter') performIngredientSearch(); });
    }

    // Auth forms
    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault(); const email = document.getElementById('signup-email').value.trim().toLowerCase(); const list = getRegisteredUsers();
        if (list.some(u => u.email === email)) return alert("Registered.");
        list.push({ username: document.getElementById('signup-username').value.trim(), email, password: document.getElementById('signup-password').value });
        localStorage.setItem('cp_users', JSON.stringify(list)); localStorage.setItem('cp_active_user', JSON.stringify({ username: document.getElementById('signup-username').value.trim() }));
        window.location.reload();
    });
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault(); const verified = getRegisteredUsers().find(u => u.email === document.getElementById('login-email').value.trim().toLowerCase() && u.password === document.getElementById('login-password').value);
        if (verified) { localStorage.setItem('cp_active_user', JSON.stringify({ username: verified.username })); window.location.reload(); } else { alert("Invalid access profiles."); }
    });
    document.querySelectorAll('.close-modal-btn:not(#close-details-btn)').forEach(b => b.addEventListener('click', closeAllModals));
});