# PeddyCare - Pet Adoption & Donation Server 🐾

Welcome to the **PeddyCare Server**, the robust, secure, and modular backend API powering the PeddyCare Pet Adoption & Donation Platform.

Built with **Node.js**, **Express**, **MongoDB Atlas**, **Stripe**, and **Nodemailer**, this server handles authentication, real-time donation campaigns, pet adoption pipelines, role-based access control (RBAC), and automated email broadcasts.

---

## 🚀 Live API Base URL
- **Production Server:** [https://pet-adoption-server-olive.vercel.app](https://pet-adoption-server-olive.vercel.app)
- **Local Dev Server:** `http://localhost:5000`

---

## ✨ Core Features & Capabilities

### 🔐 1. Authentication & Security
- **JWT Authorization:** Secured endpoints with token verification (`verifyToken` middleware).
- **OTP Password Recovery:** Secure 6-digit OTP generation, hashed email verification, 5-minute TTL automatic expiration via MongoDB index, and Nodemailer email dispatch.
- **CORS Protection:** Configured to whitelist authorized client origins.

### 🐶 2. Pet Management System
- Add, update, delete, and list adoptable pets.
- Multi-criteria pet search with case-insensitive regex filtering and category queries.
- Pagination and infinite scroll feed support.
- Adoption status tracking with pet adoption locking upon approval.

### 💖 3. Donation Campaigns & Stripe Payments
- Create and manage pet medical fund and rescue campaigns.
- Real-time campaign donation tracker and progress bar computation.
- **Stripe Payment Gateway:** Secure payment intent generation (`/create-payment-intent`) and donation ledger recording.
- Pause/unpause campaign funding capabilities for campaign creators.

### 📋 4. Adoption Request Pipeline
- Submit adoption applications with pet and applicant details.
- Dual approval workflow: pet owner review and administrative oversight.
- Auto-syncs pet adoption status when an application is approved.

### 👥 5. Admin & User Dashboard Control
- **User Management:** Full user directory with interactive role assignment (`admin` / `user`) and status control (`active`, `suspended`, `banned`).
- **Platform Analytics:** Real-time platform KPI statistics (`/platform-stats`) and per-user personal activity metrics (`/user-stats/:email`).
- **Care Specialists & Team:** Dynamic staff directory management with direct Cloudinary upload support.
- **Newsletter Broadcasting:** Email subscriber collection and admin broadcast engine to dispatch rescue newsletters.
- **Interactive FAQs & Categories:** Dynamic CRUD for site FAQs and pet category classification.

---

## 🛠 Tech Stack & Dependencies

- **Runtime:** Node.js
- **Framework:** Express.js (v4.21)
- **Database:** MongoDB Atlas (MongoDB Node Driver v6.12)
- **Payments:** Stripe API (v17.5)
- **Email Service:** Nodemailer (v10.3)
- **Security:** JSON Web Tokens (jsonwebtoken), CORS, Dotenv

---

## 📂 Project Architecture

```plaintext
pet-adoption-server/
├── index.js                     # Main server entry & middleware orchestration
├── package.json                 # Dependencies & scripts
├── vercel.json                  # Vercel deployment configuration
└── src/
    ├── config/
    │   └── db.js                # MongoDB connection pool & collection handles
    ├── middleware/
    │   └── verifyToken.js       # JWT authorization guard
    ├── routes/
    │   ├── adoptions.routes.js  # Adoption requests & status sync
    │   ├── auth.routes.js       # JWT issuance & OTP password recovery
    │   ├── campaigns.routes.js  # Campaigns & Stripe payment intents
    │   ├── categories.routes.js # Pet categories management
    │   ├── faqs.routes.js       # Frequently asked questions
    │   ├── newsletter.routes.js # Newsletter subscribers & broadcast emailer
    │   ├── pets.routes.js       # Pet listings, queries & CRUD
    │   ├── stats.routes.js      # Platform and user dashboard statistics
    │   ├── team.routes.js       # Team & care specialists management
    │   └── users.routes.js      # User management, RBAC & moderation
    └── utils/
        └── mailer.js            # Nodemailer transport configuration
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
ACCESS_TOKEN_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Optional (for OTP email dispatch & newsletter broadcasts)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🏃‍♂️ Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/imamhossenbu/pet-adoption-server.git
   cd pet-adoption-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Verify the server is running:**
   ```bash
   curl http://localhost:5000/
   ```
   *Response:* `{"status":"online","message":"Pet Adoption Server is running"}`

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
