# Money Carhire – Premium Car Rental (Nairobi, Kenya)

**Money Carhire** is a modern, fully responsive front‑end website for a luxury car rental service based in Nairobi, Kenya. It showcases a premium fleet, includes customer testimonials, dark/light mode toggle, and a clean booking flow.

## Features

- **Responsive Design** – Works perfectly on desktops, tablets, and mobile devices.
- **Dark / Light Mode** – Toggle with a floating button; pure CSS solution.
- **Dynamic Car Gallery** – 10+ luxury and economy vehicles with images, ratings, and daily rates.
- **Hero Search Section** – Visual pickup location & date picker (static demo).
- **Testimonials Grid** – Social proof section.
- **Booking Ready** – Each car card links to `booking.html` with URL parameters (`?car=...&price=...`).
- **No JavaScript Required** – Pure HTML and CSS (optional JS can be added for interactivity).

## Tech Stack

- HTML
- CSS (Flexbox, Grid, CSS Variables, Media Queries)
- Font Awesome 6 (icons)

## Project Structure

money-carhire/
│
* ├── index.html # Main landing page
* ├── style.css # Core styling (light/dark mode, components)
* ├── responsive.css # Media queries & mobile adjustments
* ├── booking.html # Booking form
* ├── contact.html # Contact page 
* ├── assets/
* └── images/
* └── README.md


## Setup & Usage

1. **Clone or download** the project files.
2. Place all images inside `assets/images/` using the exact filenames listed above (case‑sensitive).
3. Open `index.html` in any modern browser.
4. To extend the site, create `booking.html` and `contact.html` using the same navbar/footer structure.

## Customisation

- **Change car prices / details** – Edit the `.car-card` blocks in `index.html`.
- **Add more cars** – Copy a `.car-card` div inside the `.cars-grid`.
- **Modify colours** – Update CSS variables in `style.css` (`--accent-gold`, `--bg-primary`, etc.).
- **Dark mode default** – The toggle is a checkbox; set `checked` on the input if you want dark mode by default.

## Browser Support

- Chrome 
- Firefox 
- Safari 
- Edge 
- Mobile browser

## Credits

- Icons: [Font Awesome](https://fontawesome.com/)
- Images: Placeholder car images – replace with your own for production.

## License

This project is for demonstration purposes. You are free to use and modify it for your own car rental business.

---

**Money Carhire** – *Drive Beyond Ordinary.*