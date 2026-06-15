# 🍸 Bartending App

A full-stack, real-time bartending and event drink-ordering platform — built with **React**, **Express**, **PostgreSQL**, and **Docker**.

This app allows event guests to browse and order drinks through a responsive DoorDash-style interface, while bartenders manage incoming orders and menu availability from a secure dashboard.

---

## 🚀 Features

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
├── docker-compose.example.yml      # Normal-use orchestration with GHCR images
├── docker-compose.dev.example.yml  # Development orchestration with local builds
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
Copy the contents of `.env.example` into `.env` and `.env-frontend.example` into `.env-frontend`.
Edit the secrets and IP addresses as appropriate.

### 🚢 Non-Development Use with GHCR Images

Use `docker-compose.example.yml` for normal deployments where the backend and frontend images are pulled from GHCR instead of built locally. This file defaults to `ghcr.io/superdingo101/bartender-app-server:latest` for the backend and `ghcr.io/superdingo101/bartender-app-client:latest` for the frontend.

```bash
cp docker-compose.example.yml docker-compose.yml
docker compose pull
docker compose up -d
```

If you need a different tag or fork, set `BACKEND_IMAGE` and `FRONTEND_IMAGE` in your shell or `.env` before starting the stack.

- Frontend → http://localhost:3000
- Backend API → http://localhost:5000
- PostgreSQL → localhost:5432 (internal network)

### 🛠️ Development with Local Docker Builds

Use the development compose example when you want Docker Compose to build the frontend and backend images from your local checkout and mount the source directories for iterative work.

```bash
cp docker-compose.dev.example.yml docker-compose.yml
cd server && npm install
cd ../client && npm install
cd ..
docker compose up --build -d
```

The development compose file runs the backend with `npm run dev`, mounts local source into the containers, and uses `npx prisma migrate dev --name init` for local database migrations.

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

### ✅ Completed
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

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

> _“Built to make event bartending smoother, faster, and more fun.”_

## 🌐 Production reverse proxy / GHCR deployment

The production frontend image builds the Create React App bundle during Docker build and serves the static files with nginx on container port `80`; it does **not** run `react-scripts start`. This avoids the CRA development-server websocket in production.

For a single public HTTPS origin such as `https://bartender.example.com`, leave `REACT_APP_API_URL` blank (or set it to the same public origin). The browser will then call same-origin paths:

- REST API: `/api/...`
- health check: `/health`
- Socket.IO: `/socket.io/...`

Do not set production `REACT_APP_API_URL` to a LAN address like `http://192.168.x.x:5000`; that can trigger browser local-network-access prompts and mixed-content warnings when the app is opened over HTTPS.

Example Caddy config:

```caddyfile
bartender.example.com {
  reverse_proxy /api/* backend:5000
  reverse_proxy /health backend:5000
  reverse_proxy /socket.io/* backend:5000
  reverse_proxy frontend:80
}
```

When deploying publicly, restrict backend browser origins with one of these environment variables:

```env
NODE_ENV=production
CORS_ORIGIN=https://bartender.example.com
# or
CLIENT_URL=https://bartender.example.com
```

If the API is intentionally hosted on a different public HTTPS origin, set `REACT_APP_API_URL=https://api.example.com` at frontend build time and include the frontend origin in `CORS_ORIGIN` or `CLIENT_URL`.
