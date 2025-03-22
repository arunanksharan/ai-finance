"""
Potential Future Exposure (PFE) calculator service.
"""
import logging
import math
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from scipy import stats

from app.schemas.pfe import (
    AssetClass,
    AssetClassBreakdown,
    CalculationMethod,
    Collateral,
    ConfidenceLevel,
    ExposureProfile,
    NettingSet,
    PFEInput,
    PFEResult,
    TimeHorizon,
    Trade,
    TransactionType,
)

logger = logging.getLogger(__name__)


class PFEService:
    """
    Service for Potential Future Exposure (PFE) calculations.
    """
    
    # Supervisory factors by asset class (based on SA-CCR)
    SUPERVISORY_FACTORS = {
        AssetClass.INTEREST_RATE: 0.005,
        AssetClass.CREDIT: 0.05,
        AssetClass.EQUITY: 0.32,
        AssetClass.COMMODITY: 0.18,
        AssetClass.FX: 0.04,
    }
    
    # Correlation parameters by asset class
    CORRELATION_PARAMETERS = {
        AssetClass.INTEREST_RATE: 0.5,
        AssetClass.CREDIT: 0.5,
        AssetClass.EQUITY: 0.5,
        AssetClass.COMMODITY: 0.4,
        AssetClass.FX: 0.5,
    }
    
    # Time horizon mapping to years
    TIME_HORIZON_YEARS = {
        TimeHorizon.ONE_WEEK: 1/52,
        TimeHorizon.ONE_MONTH: 1/12,
        TimeHorizon.THREE_MONTH: 3/12,
        TimeHorizon.SIX_MONTH: 6/12,
        TimeHorizon.ONE_YEAR: 1.0,
        TimeHorizon.TWO_YEAR: 2.0,
        TimeHorizon.FIVE_YEAR: 5.0,
    }
    
    # Confidence level mapping to z-scores
    CONFIDENCE_LEVELS = {
        ConfidenceLevel.CL_95: 1.645,
        ConfidenceLevel.CL_97_5: 1.96,
        ConfidenceLevel.CL_99: 2.326,
    }
    
    @staticmethod
    def calculate_supervisory_delta(trade: Trade) -> float:
        """
        Calculate supervisory delta adjustment.
        
        Args:
            trade: Trade data.
            
        Returns:
            Supervisory delta adjustment.
        """
        # If supervisory delta is provided, use it
        if trade.supervisory_delta is not None:
            return trade.supervisory_delta
        
        # For non-option transactions
        if trade.transaction_type not in [TransactionType.OPTION, TransactionType.SWAPTION]:
            return 1.0
        
        # For options, use a simplified approach
        # In a real implementation, this would use Black-Scholes or other option pricing models
        return 0.5
    
    @staticmethod
    def calculate_maturity_factor(trade: Trade) -> float:
        """
        Calculate maturity factor.
        
        Args:
            trade: Trade data.
            
        Returns:
            Maturity factor.
        """
        # If maturity factor is provided, use it
        if trade.maturity_factor is not None:
            return trade.maturity_factor
        
        # Calculate maturity factor
        maturity = min(trade.maturity, 1.0)
        return math.sqrt(maturity / 1.0)
    
    @staticmethod
    def calculate_collateral_value(collateral: List[Collateral]) -> float:
        """
        Calculate total collateral value.
        
        Args:
            collateral: List of collateral.
            
        Returns:
            Total collateral value.
        """
        return sum((1 - c.haircut) * c.amount for c in collateral)
    
    @staticmethod
    def calculate_replacement_cost(netting_set: NettingSet) -> float:
        """
        Calculate replacement cost.
        
        Args:
            netting_set: Netting set data.
            
        Returns:
            Replacement cost.
        """
        # Sum of all trade market values
        total_market_value = sum(trade.market_value for trade in netting_set.trades)
        
        # Calculate collateral value
        collateral_value = PFEService.calculate_collateral_value(netting_set.collateral)
        
        # Replacement cost is max(V - C, 0)
        return max(total_market_value - collateral_value, 0)
    
    @staticmethod
    def calculate_add_on(netting_set: NettingSet) -> Dict[AssetClass, float]:
        """
        Calculate add-on for potential future exposure.
        
        Args:
            netting_set: Netting set data.
            
        Returns:
            Add-on by asset class.
        """
        # Group trades by asset class
        trades_by_asset_class = {}
        for trade in netting_set.trades:
            if trade.asset_class not in trades_by_asset_class:
                trades_by_asset_class[trade.asset_class] = []
            trades_by_asset_class[trade.asset_class].append(trade)
        
        # Calculate add-on for each asset class
        add_ons = {}
        for asset_class, trades in trades_by_asset_class.items():
            # Get supervisory factor for the asset class
            supervisory_factor = PFEService.SUPERVISORY_FACTORS[asset_class]
            
            # Calculate effective notional for the asset class
            effective_notional = 0.0
            for trade in trades:
                # Calculate supervisory delta
                supervisory_delta = PFEService.calculate_supervisory_delta(trade)
                
                # Calculate maturity factor
                maturity_factor = PFEService.calculate_maturity_factor(trade)
                
                # Calculate effective notional
                effective_notional += supervisory_delta * trade.notional * maturity_factor
            
            # Calculate add-on
            add_on = supervisory_factor * effective_notional
            add_ons[asset_class] = add_on
        
        return add_ons
    
    @staticmethod
    def calculate_potential_future_exposure_sa_ccr(
        netting_set: NettingSet,
        time_horizon: TimeHorizon,
        confidence_level: ConfidenceLevel,
    ) -> Tuple[float, Dict[AssetClass, float]]:
        """
        Calculate potential future exposure using SA-CCR method.
        
        Args:
            netting_set: Netting set data.
            time_horizon: Time horizon for PFE calculation.
            confidence_level: Confidence level for PFE calculation.
            
        Returns:
            Tuple of PFE and add-ons by asset class.
        """
        # Calculate add-on by asset class
        add_ons = PFEService.calculate_add_on(netting_set)
        
        # Calculate total add-on
        total_add_on = sum(add_ons.values())
        
        # Calculate multiplier
        replacement_cost = PFEService.calculate_replacement_cost(netting_set)
        if total_add_on == 0:
            multiplier = 1.0
        else:
            floor = 0.05
            exp_term = min(1.0, (replacement_cost / (2.0 * total_add_on)))
            multiplier = floor + (1.0 - floor) * math.exp(-exp_term)
        
        # Calculate potential future exposure
        pfe = multiplier * total_add_on
        
        # Scale PFE based on time horizon
        time_factor = math.sqrt(PFEService.TIME_HORIZON_YEARS[time_horizon])
        pfe *= time_factor
        
        # Scale PFE based on confidence level
        confidence_factor = PFEService.CONFIDENCE_LEVELS[confidence_level] / 1.96  # 1.96 is the default z-score for 97.5%
        pfe *= confidence_factor
        
        return pfe, add_ons
    
    @staticmethod
    def calculate_potential_future_exposure_internal_model(
        netting_set: NettingSet,
        time_horizon: TimeHorizon,
        confidence_level: ConfidenceLevel,
    ) -> Tuple[float, Dict[AssetClass, float], List[ExposureProfile]]:
        """
        Calculate potential future exposure using internal model method.
        
        Args:
            netting_set: Netting set data.
            time_horizon: Time horizon for PFE calculation.
            confidence_level: Confidence level for PFE calculation.
            
        Returns:
            Tuple of PFE, add-ons by asset class, and exposure profile.
        """
        # In a real implementation, this would use a more sophisticated model
        # For this example, we'll use a simplified approach
        
        # Calculate PFE using SA-CCR as a base
        pfe, add_ons = PFEService.calculate_potential_future_exposure_sa_ccr(
            netting_set=netting_set,
            time_horizon=time_horizon,
            confidence_level=confidence_level,
        )
        
        # Apply an adjustment factor for internal model
        adjustment_factor = 0.8  # Internal models typically produce lower PFE than SA-CCR
        pfe *= adjustment_factor
        
        # Generate exposure profile
        exposure_profile = PFEService.generate_exposure_profile(
            netting_set=netting_set,
            time_horizon=time_horizon,
            pfe=pfe,
        )
        
        return pfe, add_ons, exposure_profile
    
    @staticmethod
    def calculate_potential_future_exposure_historical(
        netting_set: NettingSet,
        time_horizon: TimeHorizon,
        confidence_level: ConfidenceLevel,
    ) -> Tuple[float, Dict[AssetClass, float], List[ExposureProfile]]:
        """
        Calculate potential future exposure using historical method.
        
        Args:
            netting_set: Netting set data.
            time_horizon: Time horizon for PFE calculation.
            confidence_level: Confidence level for PFE calculation.
            
        Returns:
            Tuple of PFE, add-ons by asset class, and exposure profile.
        """
        # In a real implementation, this would use historical market data
        # For this example, we'll use a simplified approach
        
        # Calculate PFE using SA-CCR as a base
        pfe, add_ons = PFEService.calculate_potential_future_exposure_sa_ccr(
            netting_set=netting_set,
            time_horizon=time_horizon,
            confidence_level=confidence_level,
        )
        
        # Apply an adjustment factor for historical method
        adjustment_factor = 1.1  # Historical methods typically produce higher PFE than SA-CCR
        pfe *= adjustment_factor
        
        # Generate exposure profile
        exposure_profile = PFEService.generate_exposure_profile(
            netting_set=netting_set,
            time_horizon=time_horizon,
            pfe=pfe,
        )
        
        return pfe, add_ons, exposure_profile
    
    @staticmethod
    def generate_exposure_profile(
        netting_set: NettingSet,
        time_horizon: TimeHorizon,
        pfe: float,
    ) -> List[ExposureProfile]:
        """
        Generate exposure profile.
        
        Args:
            netting_set: Netting set data.
            time_horizon: Time horizon for PFE calculation.
            pfe: Potential future exposure.
            
        Returns:
            Exposure profile.
        """
        # Define time points based on time horizon
        time_horizon_years = PFEService.TIME_HORIZON_YEARS[time_horizon]
        
        if time_horizon_years <= 1/12:  # One month or less
            time_points = ["1d", "1w", "2w", "3w", "1m"]
        elif time_horizon_years <= 3/12:  # Three months or less
            time_points = ["1d", "1w", "2w", "1m", "2m", "3m"]
        elif time_horizon_years <= 1.0:  # One year or less
            time_points = ["1d", "1w", "1m", "3m", "6m", "9m", "1y"]
        else:  # More than one year
            time_points = ["1d", "1m", "3m", "6m", "1y", "2y", "3y", "5y"]
            time_points = [tp for tp in time_points if PFEService.time_point_to_years(tp) <= time_horizon_years]
        
        # Generate exposure profile
        exposure_profile = []
        
        # Calculate replacement cost (expected exposure at time 0)
        replacement_cost = PFEService.calculate_replacement_cost(netting_set)
        
        for time_point in time_points:
            # Convert time point to years
            years = PFEService.time_point_to_years(time_point)
            
            # Calculate expected exposure (decaying from replacement cost to 0)
            expected_exposure = replacement_cost * math.exp(-2 * years)
            
            # Calculate PFE at this time point (increasing and then decreasing)
            time_factor = math.sqrt(years / time_horizon_years)
            time_profile_factor = 4 * years * (1 - years / time_horizon_years) if years < time_horizon_years else 0.0
            potential_future_exposure = pfe * time_factor * time_profile_factor
            
            exposure_profile.append(ExposureProfile(
                time_point=time_point,
                expected_exposure=expected_exposure,
                potential_future_exposure=potential_future_exposure,
            ))
        
        return exposure_profile
    
    @staticmethod
    def time_point_to_years(time_point: str) -> float:
        """
        Convert time point string to years.
        
        Args:
            time_point: Time point string (e.g., "1d", "1w", "1m", "1y").
            
        Returns:
            Time in years.
        """
        value = float(time_point[:-1])
        unit = time_point[-1]
        
        if unit == "d":
            return value / 365
        elif unit == "w":
            return value / 52
        elif unit == "m":
            return value / 12
        elif unit == "y":
            return value
        else:
            raise ValueError(f"Invalid time point unit: {unit}")
    
    @classmethod
    def calculate_pfe(cls, input_data: PFEInput) -> PFEResult:
        """
        Calculate Potential Future Exposure (PFE).
        
        Args:
            input_data: PFE input data.
            
        Returns:
            PFE calculation result.
        """
        try:
            # Initialize results
            total_pfe = 0.0
            total_expected_exposure = 0.0
            all_add_ons = {}
            netting_set_results = {}
            exposure_profiles = []
            
            # Process each netting set
            for netting_set in input_data.netting_sets:
                # Calculate PFE based on the selected method
                if input_data.calculation_method == CalculationMethod.SA_CCR:
                    pfe, add_ons = cls.calculate_potential_future_exposure_sa_ccr(
                        netting_set=netting_set,
                        time_horizon=input_data.time_horizon,
                        confidence_level=input_data.confidence_level,
                    )
                    
                    # Generate exposure profile
                    exposure_profile = cls.generate_exposure_profile(
                        netting_set=netting_set,
                        time_horizon=input_data.time_horizon,
                        pfe=pfe,
                    )
                
                elif input_data.calculation_method == CalculationMethod.INTERNAL_MODEL:
                    pfe, add_ons, exposure_profile = cls.calculate_potential_future_exposure_internal_model(
                        netting_set=netting_set,
                        time_horizon=input_data.time_horizon,
                        confidence_level=input_data.confidence_level,
                    )
                
                elif input_data.calculation_method == CalculationMethod.HISTORICAL:
                    pfe, add_ons, exposure_profile = cls.calculate_potential_future_exposure_historical(
                        netting_set=netting_set,
                        time_horizon=input_data.time_horizon,
                        confidence_level=input_data.confidence_level,
                    )
                
                else:
                    raise ValueError(f"Unsupported calculation method: {input_data.calculation_method}")
                
                # Calculate expected exposure
                expected_exposure = cls.calculate_replacement_cost(netting_set)
                
                # Update totals
                total_pfe += pfe
                total_expected_exposure += expected_exposure
                
                # Update add-ons
                for asset_class, add_on in add_ons.items():
                    if asset_class not in all_add_ons:
                        all_add_ons[asset_class] = 0.0
                    all_add_ons[asset_class] += add_on
                
                # Store netting set results
                netting_set_results[netting_set.id] = {
                    "pfe": pfe,
                    "expected_exposure": expected_exposure,
                    "add_ons": {str(k): v for k, v in add_ons.items()},
                }
                
                # Store exposure profile
                if not exposure_profiles:
                    exposure_profiles = exposure_profile
                else:
                    # Combine exposure profiles
                    for i, profile in enumerate(exposure_profile):
                        exposure_profiles[i].expected_exposure += profile.expected_exposure
                        exposure_profiles[i].potential_future_exposure += profile.potential_future_exposure
            
            # Calculate asset class breakdown
            asset_class_breakdown = []
            total_add_on = sum(all_add_ons.values())
            
            for asset_class, add_on in all_add_ons.items():
                percentage = (add_on / total_add_on) * 100 if total_add_on > 0 else 0.0
                
                asset_class_breakdown.append(AssetClassBreakdown(
                    asset_class=asset_class,
                    exposure=add_on,
                    percentage=percentage,
                ))
            
            # Create and return the result
            return PFEResult(
                total_pfe=total_pfe,
                total_expected_exposure=total_expected_exposure,
                calculation_method=input_data.calculation_method,
                time_horizon=input_data.time_horizon,
                confidence_level=input_data.confidence_level,
                exposure_profile=exposure_profiles,
                asset_class_breakdown=asset_class_breakdown,
                netting_set_results=netting_set_results,
            )
        
        except Exception as e:
            logger.error(f"Error in PFE calculation: {str(e)}")
            raise
