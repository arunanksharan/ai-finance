# Kuzushi Finance Tools Platform

A comprehensive finance tools platform featuring various financial calculators, including Value at Risk (VaR), Potential Future Exposure (PFE), Standardized Approach for Counterparty Credit Risk (SA-CCR), and Initial Margin (IM) calculators.

## 🌟 Overview

This monorepo contains a full-stack application built with FastAPI for the backend and Next.js for the frontend. The platform provides financial institutions and professionals with powerful tools to assess and manage risk across different asset classes and calculation methodologies.

## 🧰 Key Features

- **Value at Risk (VaR) Calculator**: Assess portfolio risk using historical simulation, Monte Carlo, and parametric methods
- **Potential Future Exposure (PFE) Calculator**: Calculate potential credit exposure using SA-CCR, Internal Model, and Historical approaches
- **SA-CCR Calculator**: Implement the Basel Committee's Standardized Approach for Counterparty Credit Risk
- **Initial Margin Calculator**: Calculate initial margin requirements using both Grid/Schedule Approach and ISDA SIMM implementation
- **User Authentication**: Secure JWT-based authentication system
- **Data Visualization**: Interactive charts and tables for risk analysis
- **Batch Processing**: Support for CSV uploads for bulk calculations

## 🏗️ Architecture

The project is structured as a monorepo with two main components:

- **Backend**: FastAPI application with modular API endpoints, services, and schemas
- **Frontend**: Next.js application with TypeScript, Tailwind CSS, and shadcn UI components

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-finance
   ```

2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Create environment variables:
   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Update the variables with your configuration

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## 📂 Project Structure

```
ai-finance/
├── backend/               # FastAPI backend application
│   ├── alembic/           # Database migrations
│   ├── app/               # Application code
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── db/            # Database models and session
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js frontend application
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility functions
│   │   └── styles/        # CSS styles
│   └── package.json       # Node.js dependencies
└── README.md              # Project documentation
```

## 🔧 Technologies

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- JWT Authentication
- Pandas, NumPy, SciPy
- YFinance

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn UI
- Recharts
- Zod
- React Hook Form
- Axios

## 🔒 Security

- JWT-based authentication
- Password hashing with Passlib
- HTTPS support
- Environment variable management
- Input validation with Pydantic and Zod

## 📊 Financial Calculators

### Value at Risk (VaR)
Calculates the maximum potential loss in the value of a portfolio over a defined period for a given confidence interval.

### Potential Future Exposure (PFE)
Measures the maximum expected credit exposure over a specified time horizon at a specified confidence level.

### SA-CCR
Implements the Standardized Approach for Counterparty Credit Risk as defined by the Basel Committee on Banking Supervision.

### Initial Margin
Calculates the initial margin requirements for non-cleared derivatives using both Grid/Schedule Approach and ISDA SIMM methodology.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com).
