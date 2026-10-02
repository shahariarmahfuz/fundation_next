# Foundation Management & Accounting System

A production-ready Foundation Management and Accounting System built with **FastAPI**, **Next.js (App Router)**, **SQLAlchemy 2.x**, **PostgreSQL**, and optional **Redis/Valkey** caching.

Designed strictly around Islamic charitable foundation accounting principles, featuring strict group-based fund segregation, interest-free Qard Hasan tracking, non-repayable Sadakah disbursements, double-entry audit ledgers with contra-entry reversals, member applications, and dynamic CMS content management.

---

## 🏛️ System Architecture

```text
Browser (Responsive Mobile-First Next.js 14 App)
      │
      ▼
Next.js Frontend (Server Components + Interactive Client Forms)
      │
      ▼ HTTP REST (JWT Bearer Auth)
FastAPI Backend (Pydantic v2 + Dependency Injection)
      │
      ├── Cache Layer ──► Redis / Valkey (Graceful degradation if offline)
      │
      └── Database ────► PostgreSQL (Neon Cloud / Local)
                          • SQLAlchemy 2.0 + psycopg 3
                          • Alembic Migrations
                          • NUMERIC(15,2) Money Types
                          • Row-level locks (SELECT FOR UPDATE)
```

---

## 📋 Core Business Rules & Invariants

1. **Groups as Accounting Units**:
   - The foundation's money is divided into Groups (e.g., General Group, Education Group, Medical Group, Emergency Group).
   - Each group maintains its own isolated balance, ledger, income, expenses, donations, Qard Hasan disbursements, and Sadakah distributions.
   - Money leaves a group in three primary ways: **Expense** (permanent operational outflow), **Sadakah** (permanent benevolent gift), or **Qard Hasan** (temporary interest-free loan receivable).
   - Inter-group transfers are atomic paired transactions (`TRANSFER_OUT` and `TRANSFER_IN`).

2. **Members & Contributions**:
   - Every active member **must** belong to exactly one Group.
   - Monthly contributions (`৳500`, etc.) automatically credit the member's assigned Group balance upon payment.
   - Contribution statuses: `PAID`, `CURRENT_PENDING`, `DUE`, `FUTURE`.
   - Reversing a contribution restores its status to `DUE` and writes a contra-entry to the group ledger.

3. **Interest-Free Qard Hasan**:
   - Interest is strictly **0%**.
   - Disbursement creates an outstanding receivable and reduces the group's available cash balance.
   - Monthly repayments reduce outstanding principal and return funds directly into the originating Group.
   - Complete tracking of disbursement date, monthly installment plan, total repaid, and remaining balance.

4. **Sadakah & Beneficiaries**:
   - Disbursed to registered beneficiaries with 0 repayment obligation.
   - Complete assistance profile aggregating both Qard Hasan loans and Sadakah grants.

5. **Financial Records & Auditability**:
   - Financial transactions are **never deleted**.
   - Any correction is recorded via a signed contra-entry `REVERSAL` transaction linked to the original transaction ID.
   - Every significant action creates an immutable record in `audit_logs` capturing user, action, model, record ID, and before/after payloads.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **PostgreSQL Database** (e.g., Neon Cloud or local instance)
- **Redis / Valkey** (Optional; automatically degrades to PostgreSQL if absent)

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in the appropriate configuration parameters:
```ini
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your_generated_secret_key
JWT_SECRET=your_generated_jwt_secret
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Backend Setup & Run
```bash
# Create virtual environment and install dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial roles, permissions, admin user, groups, and CMS content
python -m app.db.seed

# Start the FastAPI server (Runs on http://localhost:8000)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Default credentials seeded:
- **Email:** `admin@foundation.org`
- **Password:** `Admin@123456`

### 4. Frontend Setup & Run
```bash
cd frontend
npm install

# Run development server (Runs on http://localhost:3000)
npm run dev

# Or build for production
npm run build
npm start
```

---

## 🧪 Running Automated Tests

All tests run against real PostgreSQL database transactions:
```bash
# From the repository root:
PYTHONPATH=. pytest -v backend/tests
```

Frontend type-checks and lint:
```bash
cd frontend
npm run type-check
```

---

## 📁 Repository Layout

```text
├── backend/
│   ├── alembic/              # Database migration versions
│   ├── app/
│   │   ├── api/v1/endpoints/ # REST routes (auth, members, groups, ledgers, qard, etc.)
│   │   ├── core/             # DB engine, config, security, caching
│   │   ├── db/               # Initial database seeder
│   │   ├── models/           # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   └── services/         # AccountingService, AuditService
│   ├── tests/                # Pytest accounting & workflow tests
│   └── main.py               # FastAPI application entrypoint
├── frontend/
│   ├── app/                  # Next.js App Router (Public + Admin routes)
│   ├── components/           # UI components, modals, tables, headers, footers
│   ├── lib/                  # API client, CMS hooks, currency formatters
│   └── tailwind.config.ts    # Tailwind CSS design system
├── docs/                     # Architectural documentation
├── .env.example
└── README.md
```
