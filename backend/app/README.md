# Kuzushi Finance Tools - Backend Application

This directory contains the core application code for the Kuzushi Finance Tools backend.

## 📂 Directory Structure

```
app/
├── api/                # API endpoints
│   ├── deps.py         # Dependency injection
│   └── v1/             # API version 1
│       ├── endpoints/  # API endpoint modules
│       └── api.py      # API router
├── core/               # Core functionality
│   ├── config.py       # Application configuration
│   ├── security.py     # Security utilities
│   └── errors.py       # Error handling
├── db/                 # Database
│   ├── base.py         # Base model
│   ├── session.py      # Database session
│   └── init_db.py      # Database initialization
├── models/             # SQLAlchemy models
├── schemas/            # Pydantic schemas
├── services/           # Business logic services
└── main.py             # Application entry point
```

## 🔑 Key Components

### API (api/)

The API directory contains all the endpoint definitions organized by version. Each financial calculator has its own endpoint module in `api/v1/endpoints/`.

- **api.py**: Combines all endpoint routers
- **deps.py**: Contains dependency injection functions for authentication, database sessions, etc.
- **endpoints/**: Individual modules for each calculator (var.py, pfe.py, saccr.py, initial_margin.py)

### Core (core/)

Contains core application functionality:

- **config.py**: Application settings loaded from environment variables
- **security.py**: Authentication and security utilities (JWT handling, password hashing)
- **errors.py**: Custom exception handlers and error responses

### Database (db/)

Database configuration and session management:

- **base.py**: Base SQLAlchemy model
- **session.py**: Database session setup
- **init_db.py**: Database initialization script

### Models (models/)

SQLAlchemy ORM models representing database tables:

- **user.py**: User model for authentication
- **portfolio.py**: Portfolio and position models
- **calculation.py**: Models for storing calculation results

### Schemas (schemas/)

Pydantic schemas for request/response validation:

- **user.py**: User-related schemas
- **var.py**: Value at Risk input/output schemas
- **pfe.py**: Potential Future Exposure schemas
- **saccr.py**: SA-CCR schemas
- **initial_margin.py**: Initial Margin schemas

### Services (services/)

Business logic implementation for financial calculations:

- **var.py**: VaR calculation methodologies
- **pfe.py**: PFE calculation methodologies
- **saccr.py**: SA-CCR implementation
- **initial_margin.py**: Initial Margin calculation methods

## 🚀 Development Guidelines

1. **API Endpoints**:
   - Follow RESTful principles
   - Use appropriate HTTP methods (GET, POST, PUT, DELETE)
   - Include comprehensive input validation
   - Document with docstrings for automatic API docs

2. **Schema Validation**:
   - Define Pydantic schemas for all inputs and outputs
   - Include field descriptions and examples
   - Use appropriate validators

3. **Service Implementation**:
   - Separate business logic from API handlers
   - Implement proper error handling
   - Add logging for debugging and monitoring
   - Include unit tests for all calculation methods

4. **Database Models**:
   - Define clear relationships between models
   - Include appropriate indexes
   - Use migrations for schema changes

## 📊 Financial Calculators

### Value at Risk (VaR)
Calculates the maximum potential loss in the value of a portfolio over a defined period for a given confidence interval.

- **Historical Simulation**: Uses historical returns to simulate future portfolio performance
- **Monte Carlo Simulation**: Generates random scenarios based on statistical properties
- **Parametric Method**: Uses statistical parameters (mean, variance) to estimate VaR

### Potential Future Exposure (PFE)
Measures the maximum expected credit exposure over a specified time horizon at a specified confidence level.

- Implements multiple methodologies including SA-CCR, Internal Model, and Historical approaches
- Supports various asset classes and trade types
- Calculates exposure profiles over time

### SA-CCR
Implements the Basel Committee's Standardized Approach for Counterparty Credit Risk.

- Calculates Replacement Cost (RC) and Potential Future Exposure (PFE)
- Supports all major asset classes and transaction types
- Includes add-on factors and multipliers as per Basel guidelines

### Initial Margin
Calculates the initial margin requirements for non-cleared derivatives.

- **Grid/Schedule Approach**: Based on BCBS-IOSCO framework
- **ISDA SIMM**: Model-based approach with delta, vega, and curvature risk components
- Supports netting and collateral calculations
