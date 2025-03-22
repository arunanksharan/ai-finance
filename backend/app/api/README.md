# Kuzushi Finance Tools - API Documentation

This directory contains the API endpoints for the Kuzushi Finance Tools platform.

## 📂 API Structure

```
api/
├── deps.py         # Dependency injection
└── v1/             # API version 1
    ├── endpoints/  # API endpoint modules
    │   ├── auth.py           # Authentication endpoints
    │   ├── var.py            # Value at Risk endpoints
    │   ├── pfe.py            # Potential Future Exposure endpoints
    │   ├── saccr.py          # SA-CCR endpoints
    │   └── initial_margin.py # Initial Margin endpoints
    └── api.py      # API router
```

## 🔑 API Versioning

The API is versioned to ensure backward compatibility as the platform evolves. Currently, all endpoints are under the `v1` namespace.

## 🔒 Authentication

Authentication is handled through JWT tokens. Protected endpoints require a valid token in the Authorization header.

Authentication endpoints:
- `POST /api/v1/auth/login`: User login
- `POST /api/v1/auth/register`: User registration
- `POST /api/v1/auth/refresh`: Refresh access token
- `POST /api/v1/auth/logout`: User logout

## 📊 Financial Calculator Endpoints

### Value at Risk (VaR)

- `POST /api/v1/var/calculate`: Calculate VaR for a portfolio (authenticated)
- `POST /api/v1/var/calculate-public`: Public endpoint for VaR calculation

Request body example:
```json
{
  "portfolio": {
    "positions": [
      {
        "asset": "AAPL",
        "asset_class": "equity",
        "quantity": 100,
        "price": 150.0
      },
      {
        "asset": "MSFT",
        "asset_class": "equity",
        "quantity": 50,
        "price": 300.0
      }
    ]
  },
  "calculation_params": {
    "methodology": "historical",
    "confidence_level": 0.95,
    "time_horizon": 10,
    "include_stress_scenarios": true
  }
}
```

Response example:
```json
{
  "var_result": {
    "var_value": 12500.0,
    "confidence_level": 0.95,
    "time_horizon": 10,
    "methodology": "historical"
  },
  "asset_contributions": [
    {
      "asset": "AAPL",
      "contribution": 7500.0,
      "percentage": 60.0
    },
    {
      "asset": "MSFT",
      "contribution": 5000.0,
      "percentage": 40.0
    }
  ],
  "stress_scenarios": [
    {
      "scenario": "2008 Financial Crisis",
      "var_value": 25000.0
    },
    {
      "scenario": "2020 COVID Crash",
      "var_value": 18750.0
    }
  ],
  "distribution_stats": {
    "mean": -0.0001,
    "std_dev": 0.015,
    "skewness": -0.2,
    "kurtosis": 3.5
  }
}
```

### Potential Future Exposure (PFE)

- `POST /api/v1/pfe/calculate`: Calculate PFE for a netting set (authenticated)
- `POST /api/v1/pfe/calculate-public`: Public endpoint for PFE calculation

Request body example:
```json
{
  "netting_set": {
    "id": "NS001",
    "counterparty": "Bank ABC",
    "trades": [
      {
        "id": "T001",
        "asset_class": "interest_rate",
        "transaction_type": "swap",
        "notional": 1000000,
        "maturity": 5,
        "market_value": 10000
      },
      {
        "id": "T002",
        "asset_class": "equity",
        "transaction_type": "option",
        "notional": 500000,
        "maturity": 1,
        "market_value": -5000
      }
    ],
    "collateral": 0
  },
  "calculation_params": {
    "methodology": "saccr",
    "confidence_level": 0.99,
    "time_horizon": 1
  }
}
```

Response example:
```json
{
  "replacement_cost": 5000.0,
  "potential_future_exposure": 75000.0,
  "exposure_at_default": 100000.0,
  "asset_class_breakdown": [
    {
      "asset_class": "interest_rate",
      "exposure": 60000.0,
      "percentage": 60.0
    },
    {
      "asset_class": "equity",
      "exposure": 40000.0,
      "percentage": 40.0
    }
  ],
  "exposure_profile": [
    {
      "time_point": 0.25,
      "exposure": 80000.0
    },
    {
      "time_point": 0.5,
      "exposure": 90000.0
    },
    {
      "time_point": 1.0,
      "exposure": 100000.0
    }
  ]
}
```

### SA-CCR

- `POST /api/v1/saccr/calculate`: Calculate SA-CCR for a netting set (authenticated)
- `POST /api/v1/saccr/calculate-public`: Public endpoint for SA-CCR calculation
- `POST /api/v1/saccr/calculate-batch-public`: Batch calculation via CSV upload

Request body example:
```json
{
  "netting_set": {
    "id": "NS001",
    "counterparty": "Bank ABC",
    "transactions": [
      {
        "id": "T001",
        "asset_class": "interest_rate",
        "transaction_type": "swap",
        "notional": 1000000,
        "maturity": 5,
        "market_value": 10000,
        "collateral": 0
      },
      {
        "id": "T002",
        "asset_class": "equity",
        "transaction_type": "option",
        "notional": 500000,
        "maturity": 1,
        "market_value": -5000,
        "collateral": 0
      }
    ]
  }
}
```

Response example:
```json
{
  "replacement_cost": 5000.0,
  "potential_future_exposure": 75000.0,
  "exposure_at_default": 100000.0,
  "asset_class_breakdown": [
    {
      "asset_class": "interest_rate",
      "exposure": 60000.0,
      "percentage": 60.0
    },
    {
      "asset_class": "equity",
      "exposure": 40000.0,
      "percentage": 40.0
    }
  ],
  "transaction_results": {
    "T001": {
      "replacement_cost": 10000.0,
      "potential_future_exposure": 50000.0,
      "exposure_at_default": 75000.0
    },
    "T002": {
      "replacement_cost": -5000.0,
      "potential_future_exposure": 25000.0,
      "exposure_at_default": 25000.0
    }
  }
}
```

### Initial Margin

- `POST /api/v1/initial-margin/calculate`: Calculate Initial Margin (authenticated)
- `POST /api/v1/initial-margin/calculate-public`: Public endpoint for Initial Margin calculation
- `POST /api/v1/initial-margin/calculate-batch-public`: Batch calculation via CSV upload

Request body example:
```json
{
  "netting_sets": [
    {
      "id": "NS001",
      "trades": [
        {
          "id": "T001",
          "asset_class": "interest_rate",
          "product": "swap",
          "notional": 1000000,
          "maturity": 5,
          "market_value": 10000,
          "delta": 1,
          "vega": 0,
          "curvature": 0
        },
        {
          "id": "T002",
          "asset_class": "equity",
          "product": "option",
          "notional": 500000,
          "maturity": 1,
          "market_value": -5000,
          "delta": 0.5,
          "vega": 0.1,
          "curvature": 0.01
        }
      ]
    }
  ],
  "calculation_method": "simm"
}
```

Response example:
```json
{
  "total_margin": 85000.0,
  "calculation_method": "simm",
  "asset_class_breakdown": [
    {
      "asset_class": "interest_rate",
      "margin": 50000.0,
      "percentage": 58.82
    },
    {
      "asset_class": "equity",
      "margin": 35000.0,
      "percentage": 41.18
    }
  ],
  "sensitivity_breakdown": {
    "delta": 70000.0,
    "vega": 10000.0,
    "curvature": 5000.0
  },
  "netting_set_results": {
    "NS001": {
      "margin": 85000.0,
      "trade_count": 2,
      "total_notional": 1500000.0
    }
  }
}
```

## 🔄 Batch Processing

For SA-CCR and Initial Margin calculators, batch processing is supported through CSV file uploads:

- `POST /api/v1/saccr/calculate-batch-public`: Batch SA-CCR calculation
- `POST /api/v1/initial-margin/calculate-batch-public`: Batch Initial Margin calculation

These endpoints accept multipart/form-data with a CSV file containing multiple transactions or trades.

## 🔍 Error Handling

All endpoints follow a consistent error handling pattern:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Valid input but unable to process
- **500 Internal Server Error**: Server-side error

Error response example:
```json
{
  "detail": {
    "message": "Invalid input data",
    "errors": [
      {
        "loc": ["body", "portfolio", "positions", 0, "quantity"],
        "msg": "value must be greater than 0",
        "type": "value_error.number.not_gt"
      }
    ]
  }
}
```

## 📚 API Documentation

Interactive API documentation is available at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

These documentation pages are automatically generated from the API endpoint definitions and include request/response schemas, examples, and descriptions.
