# Grave Mistake Games

## Project Overview

**Grave Mistake Games** is an interactive website project designed to promote a game studio. The website includes multiple sections like About Us, Game Information, News, and Contact. The platform also supports user interaction through a contact form, and it incorporates media-rich content like videos and image galleries. The site is built using Flask, a lightweight web framework for Python, and leverages HTML, CSS, and JavaScript for the front-end.

## Project Structure

Here’s a breakdown of the project structure:

### Python Backend
- **app.py**: This is the main application file, which contains all the Flask routes and the core logic for handling requests, rendering templates, and managing user sessions.
- **Models**: The project uses SQLAlchemy ORM to manage database models like `User`, `Post`, `Media`, `AboutUs`, `GameSection`, and others.
- **Forms**: Flask-WTF is used to manage forms like `LoginForm`, `ContactForm`, and others.

### Templates
- **index.html**: The main landing page template. It includes sections for displaying game information, news, and a contact form.
- **login.html**: The login page template for user authentication.
- **dashboard.html**: (Assumed based on `dashboard.js`) This template is likely used for the admin dashboard where posts and other content can be managed.

### Static Files
- **CSS**:
  - **styles.css**: Contains the styling for various sections of the site including navigation, media galleries, and responsive design elements.
- **JavaScript**:
  - **index.js**: Manages interactivity on the landing page, such as handling the contact form submission via AJAX.
  - **dashboard.js**: Handles functionalities specific to the admin dashboard.

### Database
- The project uses SQLite for storing data, and the database file is configured to be stored in the `static` directory (`site.db`).

## Features

- **Responsive Design**: The website is fully responsive and adjusts beautifully across different screen sizes.
- **Interactive Sections**: Includes sections like About Us, Game Info, and News with dynamic content rendering.
- **AJAX-based Form Submission**: The contact form submits data without reloading the page, providing a smooth user experience.
- **Admin Dashboard**: Allows authenticated users to manage posts and content displayed on the site.

## Requirements

Here’s a list of required Python packages, which should be included in your `requirements.txt` file:

```plaintext
Flask==2.0.2
Flask-SQLAlchemy==2.5.1
Flask-WTF==0.15.1
Flask-Mail==0.9.1
Flask-Login==0.5.0
Flask-Migrate==3.1.0
WTForms==2.3.3
Werkzeug==2.0.2
requests==2.26.0
