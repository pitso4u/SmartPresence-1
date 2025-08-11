# SmartPresence

SmartPresence is a full-stack web application designed for time and attendance tracking. It features a modern frontend built with React and a robust backend API powered by Node.js and Express.

## ✨ Features

*   **User Authentication:** Secure login and registration system using JWT.
*   **Attendance Tracking:** Core functionality for clocking in and out.
*   **Responsive UI:** A clean user interface built with React and Tailwind CSS.
*   **RESTful API:** A well-structured backend API for managing data.

## 🛠️ Tech Stack

### Frontend
*   **React** (with TypeScript)
*   **Vite** (Build Tool)
*   **Tailwind CSS** (Styling)
*   **React Router** (Routing)

### Backend
*   **Node.js**
*   **Express** (Web Framework)
*   **SQLite** (Database)
*   **JWT (jsonwebtoken)** (Authentication)
*   **bcrypt** (Password Hashing)
*   **Zod** (Data Validation)
*   **Jest & Supertest** (Testing)

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

Make sure you have the following installed:
*   [Node.js](https://nodejs.org/en/) (v18 or later recommended)
*   [npm](https://www.npmjs.com/get-npm) (comes with Node.js)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/SmartPresence-1.git
    cd SmartPresence-1
    ```

2.  **Install Frontend Dependencies:**
    From the project root directory, run:
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    Navigate to the `server` directory and install its dependencies:
    ```bash
    cd server
    npm install
    ```

4.  **Configure Environment Variables:**
    In the `server` directory, copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Then, open the `.env` file and fill in the required values (like `JWT_SECRET`).

### Running the Application

You'll need to run the frontend and backend servers in separate terminals.

1.  **Start the Backend Server:**
    In the `server` directory, run:
    ```bash
    npm run dev
    ```
    The API will be running on `http://localhost:3001` (or the port specified in your `.env`).

2.  **Start the Frontend Development Server:**
    In the project root directory, run:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Available Scripts

### Root Directory (Frontend)
*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Builds the app for production.
*   `npm run preview`: Previews the production build locally.

### `/server` Directory (Backend)
*   `npm run dev`: Starts the server with `nodemon` for auto-reloading.
*   `npm start`: Runs the server in production mode.
*   `npm test`: Runs the API tests with Jest.
