"""
SACCR (Standardized Approach for Counterparty Credit Risk) calculator service.
"""
import logging
import math
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from scipy.stats import norm

from app.schemas.saccr import (
    AssetClass,
    AssetClassResult,
    NettingSet,
    OptionStyle,
    OptionType,
    SACCRInput,
    SACCRResult,
    Transaction,
    TransactionType,
)

logger = logging.getLogger(__name__)


class SACCRService:
    """
    Service for SACCR calculations.
    """
    
    # Supervisory factors by asset class
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
    
    @staticmethod
    def calculate_black_scholes(
        option_type: OptionType,
        underlying_price: float,
        strike_price: float,
        time_to_maturity: float,
        volatility: float,
        interest_rate: float,
    ) -> Tuple[float, float, float]:
        """
        Calculate option price and Greeks using Black-Scholes model.
        
        Args:
            option_type: Type of option (call or put).
            underlying_price: Current price of the underlying asset.
            strike_price: Strike price of the option.
            time_to_maturity: Time to maturity in years.
            volatility: Volatility of the underlying asset.
            interest_rate: Risk-free interest rate.
            
        Returns:
            Tuple of option price, delta, and gamma.
        """
        d1 = (math.log(underlying_price / strike_price) + (interest_rate + 0.5 * volatility ** 2) * time_to_maturity) / (volatility * math.sqrt(time_to_maturity))
        d2 = d1 - volatility * math.sqrt(time_to_maturity)
        
        if option_type == OptionType.CALL:
            price = underlying_price * norm.cdf(d1) - strike_price * math.exp(-interest_rate * time_to_maturity) * norm.cdf(d2)
            delta = norm.cdf(d1)
        else:  # Put option
            price = strike_price * math.exp(-interest_rate * time_to_maturity) * norm.cdf(-d2) - underlying_price * norm.cdf(-d1)
            delta = norm.cdf(d1) - 1
        
        gamma = norm.pdf(d1) / (underlying_price * volatility * math.sqrt(time_to_maturity))
        
        return price, delta, gamma
    
    @staticmethod
    def calculate_supervisory_delta(transaction: Transaction) -> float:
        """
        Calculate supervisory delta adjustment.
        
        Args:
            transaction: Transaction data.
            
        Returns:
            Supervisory delta adjustment.
        """
        # If supervisory delta is provided, use it
        if transaction.supervisory_delta is not None:
            return transaction.supervisory_delta
        
        # For non-option transactions
        if transaction.transaction_type not in [TransactionType.OPTION, TransactionType.SWAPTION]:
            return 1.0
        
        # For options, calculate using Black-Scholes
        if (
            transaction.underlying_price is None
            or transaction.strike_price is None
            or transaction.option_type is None
            or transaction.volatility is None
            or transaction.interest_rate is None
        ):
            raise ValueError("Missing required option parameters for delta calculation")
        
        # Calculate delta using Black-Scholes
        _, delta, _ = SACCRService.calculate_black_scholes(
            option_type=transaction.option_type,
            underlying_price=transaction.underlying_price,
            strike_price=transaction.strike_price,
            time_to_maturity=transaction.maturity,
            volatility=transaction.volatility,
            interest_rate=transaction.interest_rate,
        )
        
        # Adjust for option type
        if transaction.option_type == OptionType.PUT:
            delta = -delta
        
        return delta
    
    @staticmethod
    def calculate_maturity_factor(transaction: Transaction) -> float:
        """
        Calculate maturity factor.
        
        Args:
            transaction: Transaction data.
            
        Returns:
            Maturity factor.
        """
        # If maturity factor is provided, use it
        if transaction.maturity_factor is not None:
            return transaction.maturity_factor
        
        # Calculate maturity factor
        maturity = min(transaction.maturity, 1.0)
        return math.sqrt(maturity / 1.0)
    
    @staticmethod
    def calculate_adjusted_notional(transaction: Transaction) -> float:
        """
        Calculate adjusted notional.
        
        Args:
            transaction: Transaction data.
            
        Returns:
            Adjusted notional.
        """
        return transaction.notional
    
    @staticmethod
    def calculate_replacement_cost(netting_set: NettingSet) -> float:
        """
        Calculate replacement cost.
        
        Args:
            netting_set: Netting set data.
            
        Returns:
            Replacement cost.
        """
        # Simplified calculation: sum of all transaction values minus collateral
        total_value = 0.0
        for transaction in netting_set.transactions:
            # For options, calculate the value using Black-Scholes
            if transaction.transaction_type in [TransactionType.OPTION, TransactionType.SWAPTION]:
                if (
                    transaction.underlying_price is not None
                    and transaction.strike_price is not None
                    and transaction.option_type is not None
                    and transaction.volatility is not None
                    and transaction.interest_rate is not None
                ):
                    price, _, _ = SACCRService.calculate_black_scholes(
                        option_type=transaction.option_type,
                        underlying_price=transaction.underlying_price,
                        strike_price=transaction.strike_price,
                        time_to_maturity=transaction.maturity,
                        volatility=transaction.volatility,
                        interest_rate=transaction.interest_rate,
                    )
                    total_value += price * transaction.notional
                else:
                    # If option parameters are missing, use a simplified approach
                    total_value += 0.1 * transaction.notional
            else:
                # For non-option transactions, use a simplified approach
                total_value += 0.05 * transaction.notional
        
        # Replacement cost is max(V - C, 0)
        return max(total_value - netting_set.collateral, 0)
    
    @staticmethod
    def calculate_add_on(netting_set: NettingSet) -> Dict[AssetClass, float]:
        """
        Calculate add-on for potential future exposure.
        
        Args:
            netting_set: Netting set data.
            
        Returns:
            Add-on by asset class.
        """
        # Group transactions by asset class
        transactions_by_asset_class = {}
        for transaction in netting_set.transactions:
            if transaction.asset_class not in transactions_by_asset_class:
                transactions_by_asset_class[transaction.asset_class] = []
            transactions_by_asset_class[transaction.asset_class].append(transaction)
        
        # Calculate add-on for each asset class
        add_ons = {}
        for asset_class, transactions in transactions_by_asset_class.items():
            # Get supervisory factor for the asset class
            supervisory_factor = SACCRService.SUPERVISORY_FACTORS[asset_class]
            
            # Calculate effective notional for the asset class
            effective_notional = 0.0
            for transaction in transactions:
                # Calculate supervisory delta
                supervisory_delta = SACCRService.calculate_supervisory_delta(transaction)
                
                # Calculate maturity factor
                maturity_factor = SACCRService.calculate_maturity_factor(transaction)
                
                # Calculate adjusted notional
                adjusted_notional = SACCRService.calculate_adjusted_notional(transaction)
                
                # Calculate effective notional
                effective_notional += supervisory_delta * adjusted_notional * maturity_factor
            
            # Calculate add-on
            add_on = supervisory_factor * effective_notional
            add_ons[asset_class] = add_on
        
        return add_ons
    
    @staticmethod
    def calculate_potential_future_exposure(netting_set: NettingSet) -> Tuple[float, Dict[AssetClass, float]]:
        """
        Calculate potential future exposure.
        
        Args:
            netting_set: Netting set data.
            
        Returns:
            Tuple of total potential future exposure and add-ons by asset class.
        """
        # Calculate add-on by asset class
        add_ons = SACCRService.calculate_add_on(netting_set)
        
        # Calculate total add-on
        total_add_on = sum(add_ons.values())
        
        # Calculate multiplier
        replacement_cost = SACCRService.calculate_replacement_cost(netting_set)
        if total_add_on == 0:
            multiplier = 1.0
        else:
            floor = 0.05
            exp_term = min(1.0, (replacement_cost / (2.0 * total_add_on)))
            multiplier = floor + (1.0 - floor) * math.exp(-exp_term)
        
        # Calculate potential future exposure
        pfe = multiplier * total_add_on
        
        return pfe, add_ons
    
    @classmethod
    def calculate_saccr(cls, input_data: SACCRInput) -> SACCRResult:
        """
        Calculate SACCR exposure at default.
        
        Args:
            input_data: SACCR input data.
            
        Returns:
            SACCR calculation result.
        """
        try:
            # Initialize results
            total_replacement_cost = 0.0
            total_potential_future_exposure = 0.0
            asset_class_results = {}
            netting_set_results = {}
            
            # Process each netting set
            for netting_set in input_data.netting_sets:
                # Calculate replacement cost
                replacement_cost = cls.calculate_replacement_cost(netting_set)
                total_replacement_cost += replacement_cost
                
                # Calculate potential future exposure
                pfe, add_ons = cls.calculate_potential_future_exposure(netting_set)
                total_potential_future_exposure += pfe
                
                # Calculate exposure at default for the netting set
                ead = replacement_cost + pfe
                
                # Store netting set results
                netting_set_results[netting_set.id] = {
                    "replacement_cost": replacement_cost,
                    "potential_future_exposure": pfe,
                    "exposure_at_default": ead,
                    "add_ons": {str(k): v for k, v in add_ons.items()},
                }
                
                # Update asset class results
                for asset_class, add_on in add_ons.items():
                    if asset_class not in asset_class_results:
                        asset_class_results[asset_class] = {
                            "replacement_cost": 0.0,
                            "potential_future_exposure": 0.0,
                            "ead": 0.0,
                            "details": {
                                "supervisory_factor": cls.SUPERVISORY_FACTORS[asset_class],
                                "correlation_parameter": cls.CORRELATION_PARAMETERS[asset_class],
                                "transactions": [],
                            },
                        }
                    
                    # Update asset class results
                    asset_class_results[asset_class]["potential_future_exposure"] += add_on
                    asset_class_results[asset_class]["ead"] += add_on
                    
                    # Add transaction details
                    for transaction in netting_set.transactions:
                        if transaction.asset_class == asset_class:
                            supervisory_delta = cls.calculate_supervisory_delta(transaction)
                            maturity_factor = cls.calculate_maturity_factor(transaction)
                            adjusted_notional = cls.calculate_adjusted_notional(transaction)
                            
                            asset_class_results[asset_class]["details"]["transactions"].append({
                                "id": transaction.id,
                                "notional": transaction.notional,
                                "adjusted_notional": adjusted_notional,
                                "supervisory_delta": supervisory_delta,
                                "maturity_factor": maturity_factor,
                                "effective_notional": supervisory_delta * adjusted_notional * maturity_factor,
                            })
            
            # Calculate total exposure at default
            total_ead = total_replacement_cost + total_potential_future_exposure
            
            # Convert asset_class_results to AssetClassResult objects
            formatted_asset_class_results = {}
            for asset_class, result in asset_class_results.items():
                formatted_asset_class_results[asset_class] = AssetClassResult(
                    replacement_cost=result["replacement_cost"],
                    potential_future_exposure=result["potential_future_exposure"],
                    ead=result["ead"],
                    details=result["details"],
                )
            
            # Create and return the result
            return SACCRResult(
                total_ead=total_ead,
                total_replacement_cost=total_replacement_cost,
                total_potential_future_exposure=total_potential_future_exposure,
                asset_class_results=formatted_asset_class_results,
                netting_set_results=netting_set_results,
            )
        
        except Exception as e:
            logger.error(f"Error in SACCR calculation: {str(e)}")
            raise
