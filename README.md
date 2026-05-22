# Money Carhire – Premium Car Rental (Nairobi, Kenya)

A visually stunning, fully responsive luxury car rental website which showcases a premium fleet, booking page and Nairobi‑centric branding with prices in **Kenyan Shillings (KSh)**.

---

##  Features

- **Cinematic Hero Section** – full‑width background with search form  
-  **Car Showcase Grid** – 9 luxury cars 
- **Glassmorphism Design** – modern blurred backgrounds, gold accents  
-  **Pure CSS Dark Mode** – floating button toggles dark/light theme (no JS)  
-  **Booking Sidebar** – static date/location inputs, estimated total in KSh  
-  **Testimonials Section** – customer reviews with hover animations  
-  **Responsive Layout** – mobile‑friendly grid, CSS‑only hamburger menu  
  

---

##  Technologies Used

- **HTML** – semantic markup  
- **CSS** – custom properties (variables), Flexbox, Grid, animations, checkbox hack  
- **Font Awesome ** – icons  

---

## Project Structure 

The entire project is contained in **one HTML file** – no external CSS or JS required.  
Simply save the code as `index.html` and open it.
Money-Carhire/
└── index.html # Complete website (HTML + CSS inside)

---

##  How to Run Locally

1. **Copy** the full HTML code (provided above) into a new file named `index.html`.  
2. **Open** `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).  
3. No build steps, server, or internet connection required (except for external fonts/images).  


---

## Customisation Guide

### Change car prices (KSh)
Edit the `price-day` spans inside each `.car-card` block:
```html
<div class="price-day">KSh 10,500 <span>/ day</span></div>
```
### Add a new car
Duplicate a ```<div class="car-card"> ```block, update the image URL, title, specs, and price.

### Modify location options
In the booking sidebar ```<select>```, edit the ```<option>``` values.

### Adjust dark mode colors
Edit the CSS variables inside the :root and the dark mode override selector in ```<style>```.

### Change logo / brand name
Update the text inside .logo span and the hero section heading.


## Skills Practiced (for learners)
* Responsive layouts with Grid & Flexbox
* CSS custom properties (theming)
* Glassmorphism & backdrop‑filter
* Pseudo‑classes (:hover, :checked)
* Semantic HTML & accessibility basics
* Styling forms, cards, sidebars (static)
* CSS-only dark mode toggle


## Acknowledgements
* Unsplash for car imagery
* Font Awesome for icons
* Google Fonts for the Inter typeface
