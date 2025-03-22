"""
Main API router.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, finance_calculator, saccr, var, pfe, initial_margin, market_data

api_router = APIRouter()

# Include authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Include finance calculator routes
api_router.include_router(finance_calculator.router, prefix="/finance-calculator", tags=["finance-calculator"])

# Include SACCR calculator routes
api_router.include_router(saccr.router, prefix="/saccr", tags=["saccr"])

# Include VaR calculator routes
api_router.include_router(var.router, prefix="/var", tags=["var"])

# Include PFE calculator routes
api_router.include_router(pfe.router, prefix="/pfe", tags=["pfe"])

# Include Initial Margin calculator routes
api_router.include_router(initial_margin.router, prefix="/initial-margin", tags=["initial-margin"])

# Include Market Data Dashboard routes
api_router.include_router(market_data.router, prefix="/market-data", tags=["market-data"])
