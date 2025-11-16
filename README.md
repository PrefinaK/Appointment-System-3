# project-management-system-Main-Project-
# Appointment Booking System

A full-stack Appointment Booking System built with **Node.js**, **Express**, **MongoDB**, and **React**. This system allows users to register, log in, and book appointments. Admins can manage users and appointments through an admin panel.



# Features

- User registration and login
- Appointment booking and management
- Admin panel for managing users and appointments
- Secure authentication using Passport.js



## Technologies Used

- JavaScript
- HTML
- CSS
- Node.js & Express
- MongoDB
- React



## Prerequisites

Before you begin, make sure you have installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/try/download/community) (local or cloud instance)



## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/PrefinaK/Appointment-Booking-system.git
cd Appointment-Booking-system
Install backend dependencies:

bash
Copy code
cd backend
npm install
Install frontend dependencies:

bash
Copy code
cd ../frontend
npm install
Environment Variables
You need to create .env files for backend and frontend to store secret keys. Do not commit .env files to GitHub.

Example backend .env:

env
Copy code
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
Example frontend .env:

env
Copy code
REACT_APP_API_URL=http://localhost:5000/api
Running the Project
Start the backend:
bash
Copy code
cd backend
npm start
Backend will run on http://localhost:5000 (or your .env port).

Start the frontend:
bash
Copy code
cd frontend
npm start
Frontend will run on http://localhost:3000.

Project Structure
csharp
Copy code
appointment-system/
├─ backend/           # Node.js + Express backend
│  ├─ models/         # Mongoose models
│  ├─ routes/         # API routes
│  ├─ middleware/     # Auth middleware
│  ├─ server.js       # Entry point
├─ frontend/          # React frontend
│  ├─ src/            # React source code
│  ├─ public/         # Static files
│  ├─ package.json
└─ README.md
