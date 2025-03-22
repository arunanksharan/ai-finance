"""
Initial Margin (IM) calculator service.
"""
import logging
import math
from typing import Dict, List, Optional, Tuple, Union

import numpy as np

from app.schemas.initial_margin import (
    AssetClass,
    AssetClassBreakdown,
    CalculationMethod,
    InitialMarginInput,
    InitialMarginResult,
    NettingSet,
    Product,
    SensitivityBreakdown,
    Trade,
)

logger = logging.getLogger(__name__)


class InitialMarginService:
    """
    Service for Initial Margin (IM) calculations.
    """
    
    # Grid/Schedule approach thresholds (based on BCBS-IOSCO framework)
    GRID_THRESHOLDS = {
        AssetClass.INTEREST_RATE: {
            "0-2": 0.01,
            "2-5": 0.02,
            "5+": 0.04,
        },
        AssetClass.CREDIT: {
            "0-2": 0.02,
            "2-5": 0.05,
            "5+": 0.10,
        },
        AssetClass.EQUITY: {
            "0-2": 0.06,
            "2-5": 0.08,
            "5+": 0.10,
        },
        AssetClass.COMMODITY: {
            "0-2": 0.10,
            "2-5": 0.12,
            "5+": 0.15,
        },
        AssetClass.FX: {
            "0-2": 0.04,
            "2-5": 0.05,
            "5+": 0.06,
        },
    }
    
    # SIMM risk weights (simplified version of ISDA SIMM)
    SIMM_RISK_WEIGHTS = {
        AssetClass.INTEREST_RATE: {
            "delta": 0.005,
            "vega": 0.01,
            "curvature": 0.01,
        },
        AssetClass.CREDIT: {
            "delta": 0.05,
            "vega": 0.10,
            "curvature": 0.10,
        },
        AssetClass.EQUITY: {
            "delta": 0.15,
            "vega": 0.20,
            "curvature": 0.20,
        },
        AssetClass.COMMODITY: {
            "delta": 0.18,
            "vega": 0.30,
            "curvature": 0.30,
        },
        AssetClass.FX: {
            "delta": 0.04,
            "vega": 0.05,
            "curvature": 0.05,
        },
    }
    
    # SIMM correlation parameters
    SIMM_CORRELATIONS = {
        AssetClass.INTEREST_RATE: 0.5,
        AssetClass.CREDIT: 0.5,
        AssetClass.EQUITY: 0.5,
        AssetClass.COMMODITY: 0.4,
        AssetClass.FX: 0.5,
    }
    
    @staticmethod
    def get_maturity_bucket(maturity: float) -> str:
        """
        Get maturity bucket for grid approach.
        
        Args:
            maturity: Maturity in years.
            
        Returns:
            Maturity bucket.
        """
        if maturity < 2:
            return "0-2"
        elif maturity < 5:
            return "2-5"
        else:
            return "5+"
    
    @classmethod
    def calculate_grid_margin(cls, netting_set: NettingSet) -> Tuple[float, Dict[AssetClass, float]]:
        """
        Calculate initial margin using grid/schedule approach.
        
        Args:
            netting_set: Netting set data.
            
        Returns:
            Tuple of total margin and margin by asset class.
        """
        # Group trades by asset class
        trades_by_asset_class = {}
        for trade in netting_set.trades:
            if trade.asset_class not in trades_by_asset_class:
                trades_by_asset_class[trade.asset_class] = []
            trades_by_asset_class[trade.asset_class].append(trade)
        
        # Calculate margin for each asset class
        margins = {}
        for asset_class, trades in trades_by_asset_class.items():
            # Calculate gross notional for the asset class
            gross_notional = 0.0
            for trade in trades:
                # Get maturity bucket
                maturity_bucket = cls.get_maturity_bucket(trade.maturity)
                
                # Get threshold for the asset class and maturity bucket
                threshold = cls.GRID_THRESHOLDS[asset_class][maturity_bucket]
                
                # Add to gross notional
                gross_notional += abs(trade.notional)
            
            # Calculate margin for the asset class
            # In a real implementation, this would be more sophisticated
            # For this example, we'll use a simplified approach
            margin = gross_notional * cls.GRID_THRESHOLDS[asset_class]["2-5"]
            margins[asset_class] = margin
        
        # Calculate total margin
        total_margin = sum(margins.values())
        
        return total_margin, margins
    
    @classmethod
    def calculate_simm_margin(cls, netting_set: NettingSet) -> Tuple[float, Dict[AssetClass, float], SensitivityBreakdown]:
        """
        Calculate initial margin using ISDA SIMM.
        
        Args:
            netting_set: Netting set data.
            
        Returns:
            Tuple of total margin, margin by asset class, and sensitivity breakdown.
        """
        # Group trades by asset class
        trades_by_asset_class = {}
        for trade in netting_set.trades:
            if trade.asset_class not in trades_by_asset_class:
                trades_by_asset_class[trade.asset_class] = []
            trades_by_asset_class[trade.asset_class].append(trade)
        
        # Initialize sensitivity components
        total_delta = 0.0
        total_vega = 0.0
        total_curvature = 0.0
        
        # Calculate margin for each asset class
        margins = {}
        for asset_class, trades in trades_by_asset_class.items():
            # Calculate sensitivity components for the asset class
            delta_sum = 0.0
            vega_sum = 0.0
            curvature_sum = 0.0
            
            for trade in trades:
                # Calculate delta component
                delta = trade.delta if trade.delta is not None else 1.0
                delta_sum += delta * trade.notional
                
                # Calculate vega component (for options)
                if trade.product in [Product.OPTION, Product.SWAPTION]:
                    vega = trade.vega if trade.vega is not None else 0.1
                    vega_sum += vega * trade.notional
                
                # Calculate curvature component (for options)
                if trade.product in [Product.OPTION, Product.SWAPTION]:
                    curvature = trade.curvature if trade.curvature is not None else 0.01
                    curvature_sum += curvature * trade.notional
            
            # Apply risk weights
            delta_margin = abs(delta_sum) * cls.SIMM_RISK_WEIGHTS[asset_class]["delta"]
            vega_margin = abs(vega_sum) * cls.SIMM_RISK_WEIGHTS[asset_class]["vega"]
            curvature_margin = abs(curvature_sum) * cls.SIMM_RISK_WEIGHTS[asset_class]["curvature"]
            
            # Calculate total margin for the asset class
            margin = delta_margin + vega_margin + curvature_margin
            margins[asset_class] = margin
            
            # Update sensitivity components
            total_delta += delta_margin
            total_vega += vega_margin
            total_curvature += curvature_margin
        
        # Calculate total margin
        total_margin = sum(margins.values())
        
        # Create sensitivity breakdown
        sensitivity_breakdown = SensitivityBreakdown(
            delta=total_delta,
            vega=total_vega,
            curvature=total_curvature,
        )
        
        return total_margin, margins, sensitivity_breakdown
    
    @classmethod
    def calculate_initial_margin(cls, input_data: InitialMarginInput) -> InitialMarginResult:
        """
        Calculate Initial Margin (IM).
        
        Args:
            input_data: Initial Margin input data.
            
        Returns:
            Initial Margin calculation result.
        """
        try:
            # Initialize results
            total_margin = 0.0
            all_margins = {}
            netting_set_results = {}
            sensitivity_breakdown = None
            
            # Process each netting set
            for netting_set in input_data.netting_sets:
                # Calculate margin based on the selected method
                if input_data.calculation_method == CalculationMethod.GRID:
                    margin, margins = cls.calculate_grid_margin(netting_set)
                
                elif input_data.calculation_method == CalculationMethod.SIMM:
                    margin, margins, netting_sensitivity = cls.calculate_simm_margin(netting_set)
                    
                    # Initialize sensitivity breakdown if not already done
                    if sensitivity_breakdown is None:
                        sensitivity_breakdown = netting_sensitivity
                    else:
                        # Update sensitivity breakdown
                        sensitivity_breakdown.delta += netting_sensitivity.delta
                        sensitivity_breakdown.vega += netting_sensitivity.vega
                        sensitivity_breakdown.curvature += netting_sensitivity.curvature
                
                else:
                    raise ValueError(f"Unsupported calculation method: {input_data.calculation_method}")
                
                # Update totals
                total_margin += margin
                
                # Update margins by asset class
                for asset_class, asset_margin in margins.items():
                    if asset_class not in all_margins:
                        all_margins[asset_class] = 0.0
                    all_margins[asset_class] += asset_margin
                
                # Store netting set results
                netting_set_results[netting_set.id] = {
                    "margin": margin,
                    "margins_by_asset_class": {str(k): v for k, v in margins.items()},
                }
            
            # Calculate asset class breakdown
            asset_class_breakdown = []
            
            for asset_class, margin in all_margins.items():
                percentage = (margin / total_margin) * 100 if total_margin > 0 else 0.0
                
                asset_class_breakdown.append(AssetClassBreakdown(
                    asset_class=asset_class,
                    margin=margin,
                    percentage=percentage,
                ))
            
            # Create and return the result
            return InitialMarginResult(
                total_margin=total_margin,
                calculation_method=input_data.calculation_method,
                asset_class_breakdown=asset_class_breakdown,
                sensitivity_breakdown=sensitivity_breakdown,
                netting_set_results=netting_set_results,
            )
        
        except Exception as e:
            logger.error(f"Error in Initial Margin calculation: {str(e)}")
            raise
