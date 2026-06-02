#  Chef's Palette — Smart Recipe Discovery & Meal Planner

Chef's Palette is a responsive, data-driven front-end web application designed to combat household food waste and eliminate daily cooking decision fatigue. By integrating a live culinary REST API, the platform empowers users to discover recipes based on what they already have in their refrigerator, plan their weekly nutritional menu, and automatically generate consolidated shopping lists.

##  Live Demo
You can access the live deployment of the project here: **[Insert your GitHub Pages or Netlify Link Here]**

---

##  Key Features

* ** Smart "Fridge Search" Engine:** Enter a comma-separated list of items currently in your fridge, and the application will instantly fetch recipes that maximize the use of those specific ingredients.
* ** Master Explore Catalog:** Dynamically browse thousands of culinary dishes. Includes a sticky sidebar filter to isolate pure vegetarian choices, filter by meal type (Breakfast, Lunch, Dinner, Dessert), and sort by prep time or caloric metrics.
* ** Interactive Weekly Planner:** A structured calendar grid allowing users to seamlessly assign selected recipes to specific days and meal slots.
* ** Automated Grocery Aggregator:** An algorithmic data parser that extracts ingredient requirements across your entire weekly schedule, combines matching items arithmetic-wise (preventing duplicate listing), and displays an organized shopping list categorized by supermarket aisles.
* ** Leftovers Market (Community Hub):** A localized bulletin board blueprint enabling neighbors to list excess ingredients for trade rather than throwing them away.

---

##  Tech Stack & Architecture

* **Structure:** HTML5 (Semantic markup)
* **Styling:** CSS3 (Custom design tokens, Flexbox, CSS Grid layouts, and responsive media queries)
* **Logic:** Vanilla JavaScript (ES6+, Object Mapping, Array methods, and asynchronous Fetch API pipelines)
* **External Data Provider:** Spoonacular Recipe & Food REST API (JSON format)
* **Session Management:** Web Storage API (`localStorage`) to preserve user login status and meal planning state across page reloads.

---

##  Project Structure

```text
├── index.html          # Application landing page & Fridge Search engine
├── explore.html        # Master recipe catalog with sorting/filtering modules
├── meal-plans.html     # Weekly calendar dashboard & automated grocery engine
├── community.html      # Localized leftover market bulletin board
├── style.css           # Global stylesheet containing component layouts
├── script.js          # Core application logic, API integration, and algorithms
└── README.md           # Repository documentation
