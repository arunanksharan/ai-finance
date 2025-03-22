# Kuzushi Finance Tools - Backend

The backend component of the Kuzushi Finance Tools platform, built with FastAPI, providing robust API endpoints for financial calculations including VaR, PFE, SA-CCR, and Initial Margin.

## 🌟 Overview

This FastAPI application serves as the computational engine for the Kuzushi Finance Tools platform. It provides RESTful API endpoints for various financial calculators, handles user authentication, and manages data persistence.

## 🧰 Key Features

- **Modular API Design**: Organized endpoints for different financial calculators
- **Comprehensive Financial Calculations**:
  - Value at Risk (VaR) with multiple methodologies
  - Potential Future Exposure (PFE) calculations
  - SA-CCR implementation for counterparty credit risk
  - Initial Margin calculations with Grid and SIMM approaches
- **Data Validation**: Robust input validation using Pydantic schemas
- **Authentication**: JWT-based authentication system
- **Database Integration**: SQLAlchemy ORM with PostgreSQL
- **Migration Support**: Alembic for database migrations
- **Error Handling**: Comprehensive error handling and logging

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- PostgreSQL
- pip

### Installation

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration, particularly database connection details

4. Initialize the database:
   ```bash
   alembic upgrade head
   python -m app.db.init_db
   ```

### Running the Application

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` and the interactive documentation at `http://localhost:8000/docs`.

## 📂 Project Structure

```
backend/
├── alembic/                # Database migrations
│   ├── versions/           # Migration scripts
│   └── env.py              # Alembic environment configuration
├── app/                    # Application code
│   ├── api/                # API endpoints
│   │   ├── deps.py         # Dependency injection
│   │   └── v1/             # API version 1
│   │       ├── endpoints/  # API endpoint modules
│   │       └── api.py      # API router
│   ├── core/               # Core functionality
│   │   ├── config.py       # Application configuration
│   │   ├── security.py     # Security utilities
│   │   └── errors.py       # Error handling
│   ├── db/                 # Database
│   │   ├── base.py         # Base model
│   │   ├── session.py      # Database session
│   │   └── init_db.py      # Database initialization
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic services
│   └── main.py             # Application entry point
├── tests/                  # Test suite
├── .env                    # Environment variables
├── .env.example            # Example environment variables
├── requirements.txt        # Python dependencies
└── README.md               # Documentation
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/login`: User login
- `POST /api/v1/auth/register`: User registration

### Value at Risk (VaR)
- `POST /api/v1/var/calculate`: Calculate VaR for a portfolio
- `POST /api/v1/var/calculate-public`: Public endpoint for VaR calculation

### Potential Future Exposure (PFE)
- `POST /api/v1/pfe/calculate`: Calculate PFE for a netting set
- `POST /api/v1/pfe/calculate-public`: Public endpoint for PFE calculation

### SA-CCR
- `POST /api/v1/saccr/calculate`: Calculate SA-CCR for a netting set
- `POST /api/v1/saccr/calculate-public`: Public endpoint for SA-CCR calculation
- `POST /api/v1/saccr/calculate-batch-public`: Batch calculation via CSV upload

### Initial Margin
- `POST /api/v1/initial-margin/calculate`: Calculate Initial Margin
- `POST /api/v1/initial-margin/calculate-public`: Public endpoint for Initial Margin calculation
- `POST /api/v1/initial-margin/calculate-batch-public`: Batch calculation via CSV upload

## 🔧 Technologies

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation and settings management
- **Alembic**: Database migration tool
- **JWT**: JSON Web Tokens for authentication
- **Pandas & NumPy**: Data manipulation and numerical calculations
- **SciPy**: Scientific computing
- **YFinance**: Yahoo Finance market data API

## 🔒 Environment Variables

The application requires the following environment variables:

```
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=finance_tools

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_STR=/api/v1
PROJECT_NAME=Kuzushi Finance Tools
```

## 🧪 Testing

Run the test suite:
```bash
pytest
```

For coverage report:
```bash
pytest --cov=app tests/
```

## 📚 Documentation

API documentation is automatically generated and available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔍 Code Quality

Maintain code quality with:
```bash
# Linting
flake8 app tests

# Type checking
mypy app
```

## 📈 Financial Calculation Details

### Value at Risk (VaR)
- **Historical Simulation**: Uses historical returns to simulate future portfolio performance
- **Monte Carlo Simulation**: Generates random scenarios based on statistical properties
- **Parametric Method**: Uses statistical parameters (mean, variance) to estimate VaR

### Potential Future Exposure (PFE)
- Implements multiple methodologies including SA-CCR, Internal Model, and Historical approaches
- Supports various asset classes and trade types
- Calculates exposure profiles over time

### SA-CCR
- Implements the Basel Committee's Standardized Approach for Counterparty Credit Risk
- Calculates Replacement Cost (RC) and Potential Future Exposure (PFE)
- Supports all major asset classes and transaction types

### Initial Margin
- **Grid/Schedule Approach**: Based on BCBS-IOSCO framework
- **ISDA SIMM**: Model-based approach with delta, vega, and curvature risk components
- Supports netting and collateral calculations
