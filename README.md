# 🍸 Bartending App

A full-stack, real-time bartending and event drink-ordering platform — built with **React**, **Express**, **PostgreSQL**, and **Docker**.

This app allows event guests to browse and order drinks through a responsive DoorDash-style interface, while bartenders manage incoming orders and menu availability from a secure dashboard.

---

## 🚀 Features (Phases 1–7 Complete)

### 🧑‍💻 For Bartenders
- Secure login (JWT authentication)
- Live dashboard with **two views**:
  - **Order Stream View:** shows orders as they come in
  - **Batch View:** groups identical drink orders for efficiency
- Real-time updates via **Socket.IO**
- Ability to toggle drinks on/off when ingredients run out

### 🍹 For Guests
- Browse drinks in a modern, mobile-friendly menu
- Add drinks to cart and place orders in real-time
- Menu auto-updates if a drink becomes unavailable

### ⚙️ Backend
- REST API built with Express + Prisma ORM
- PostgreSQL database containerized in Docker
- Real-time communication through Socket.IO
- Environment-managed configuration

### 🖥️ Frontend
- React + Vite + TailwindCSS
- Component-driven UI (DrinkCard, Cart, Dashboard)
- State management with React Context
- Live order updates via WebSockets

---

## 🧱 Project Structure

```
.
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/        # Menu & Dashboard pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Frontend helpers
│   └── Dockerfile
│
├── server/               # Express backend
│   ├── prisma/           # Schema, migrations, seed
│   ├── routes/           # API routes (auth, drinks, orders)
│   ├── sockets/          # Socket.IO event handlers
│   ├── tests/            # Jest test suite
│   └── Dockerfile
│
├── docker-compose.yml    # Multi-container orchestration
├── .env.example          # Sample environment config
└── README.md
```

---

## 🐳 Running the App with Docker

### 1️⃣ Prerequisites
- [Docker](https://www.docker.com/) (v20+)
- [Docker Compose](https://docs.docker.com/compose/)

### 2️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/bartending-app.git
cd bartending-app
```

### 3️⃣ Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgres://bartend:secret@db:5432/bartending_app
JWT_SECRET=supersecretkey
PORT=5000
```

### 4️⃣ Build and Start the Stack
```bash
docker compose up --build
```

- Frontend → http://localhost:3000  
- Backend API → http://localhost:5000  
- PostgreSQL → localhost:5432 (internal network)

---

## 🧪 Testing

Run tests inside the containers:

```bash
# Backend unit tests
docker compose exec backend npm test

# Frontend component tests
docker compose exec frontend npm test
```

Tests include:
- ✅ Backend: Auth, CRUD for Drinks/Orders, WebSocket events
- ✅ Frontend: Component rendering, cart behavior, order submission

---

## 🔌 API Overview (Simplified)

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate bartender |
| `/api/events/:id/menu` | GET | Public menu for guests |
| `/api/orders` | POST | Create a new order |
| `/api/drinks/:id/toggle` | PATCH | Enable/disable drink |
| `/api/orders/stream` | GET | Real-time stream (Socket.IO) |

---

## 🧰 Tech Stack

**Frontend:**
- React + Vite
- TailwindCSS
- React Router
- Socket.IO Client
- Jest + React Testing Library

**Backend:**
- Node.js + Express
- Prisma ORM
- Socket.IO
- JWT Authentication
- Jest (unit/integration)

**Database:**
- PostgreSQL (Dockerized)

**DevOps:**
- Docker & Docker Compose
- ESLint + Prettier
- Hot reload for local development

---

## 🔒 Authentication

- Bartender login protected by JWT tokens.
- Guest access requires only event link or code.
- Secure cookie storage for tokens (HTTP-only in production).

---

## 🧠 Roadmap

### ✅ Completed (Phases 1–7)
- Core architecture & Docker setup
- Auth system
- Drink management
- Order management & Socket.IO
- Frontend + Bartender Dashboard

### 🔜 Planned (Future Phases)
- Inventory tracking
- Ingredient depletion logic
- Stripe integration for payments
- Admin analytics dashboard
- Multi-event support

---

## 🖼️ Screenshots (Coming Soon)

| Customer Menu | Bartender Dashboard |
|----------------|--------------------|
| *(image placeholder)* | *(image placeholder)* |

---

## 👥 Contributing

Contributions welcome!  
To run locally (without Docker):
```bash
cd server && npm install
cd ../client && npm install
npm run dev
```

Then open:
- Frontend: `localhost:3000`
- Backend: `localhost:5000`

---

## 🧑‍🍳 Author

**Your Name**  
[GitHub](https://github.com/<your-username>) • [LinkedIn](https://linkedin.com/in/<your-handle>)

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

> _“Built to make event bartending smoother, faster, and more fun.”_
