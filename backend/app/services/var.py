"""
Value at Risk (VaR) calculator service.
"""
import logging
import math
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from scipy import stats

from app.schemas.var import (
    AssetClass,
    AssetContribution,
    ConfidenceLevel,
    DistributionStatistics,
    Portfolio,
    Position,
    StressScenario,
    TimeHorizon,
    VaRInput,
    VaRMethod,
    VaRResult,
)

logger = logging.getLogger(__name__)


class VaRService:
    """
    Service for Value at Risk (VaR) calculations.
    """
    
    # Confidence level mappings to z-scores
    CONFIDENCE_LEVELS = {
        ConfidenceLevel.CL_90: 1.282,
        ConfidenceLevel.CL_95: 1.645,
        ConfidenceLevel.CL_97_5: 1.96,
        ConfidenceLevel.CL_99: 2.326,
    }
    
    # Time horizon scaling factors (square root of time rule)
    TIME_HORIZON_FACTORS = {
        TimeHorizon.ONE_DAY: 1.0,
        TimeHorizon.TEN_DAY: math.sqrt(10),
        TimeHorizon.ONE_MONTH: math.sqrt(22),
        TimeHorizon.THREE_MONTH: math.sqrt(66),
    }
    
    # Stress scenarios
    STRESS_SCENARIOS = [
        {
            "name": "Market Crash",
            "description": "Simulates a severe market crash similar to 2008 financial crisis",
            "volatility_multiplier": 3.0,
            "correlation_increase": 0.2,
        },
        {
            "name": "Interest Rate Spike",
            "description": "Simulates a sudden increase in interest rates",
            "volatility_multiplier": 2.0,
            "correlation_increase": 0.1,
            "asset_class_impacts": {
                AssetClass.INTEREST_RATE: 2.5,
                AssetClass.EQUITY: 1.5,
                AssetClass.FX: 1.2,
                AssetClass.COMMODITY: 1.0,
                AssetClass.CRYPTO: 1.3,
            },
        },
        {
            "name": "Liquidity Crisis",
            "description": "Simulates a market-wide liquidity crisis",
            "volatility_multiplier": 2.5,
            "correlation_increase": 0.3,
            "asset_class_impacts": {
                AssetClass.INTEREST_RATE: 1.5,
                AssetClass.EQUITY: 2.0,
                AssetClass.FX: 1.8,
                AssetClass.COMMODITY: 1.5,
                AssetClass.CRYPTO: 3.0,
            },
        },
    ]
    
    @staticmethod
    def calculate_portfolio_value(portfolio: Portfolio) -> float:
        """
        Calculate the total portfolio value.
        
        Args:
            portfolio: Portfolio data.
            
        Returns:
            Total portfolio value.
        """
        return sum(position.quantity * position.price for position in portfolio.positions)
    
    @staticmethod
    def calculate_parametric_var(
        portfolio: Portfolio,
        confidence_level: ConfidenceLevel,
        time_horizon: TimeHorizon,
    ) -> Tuple[float, List[AssetContribution], float]:
        """
        Calculate VaR using the parametric method.
        
        Args:
            portfolio: Portfolio data.
            confidence_level: Confidence level for VaR calculation.
            time_horizon: Time horizon for VaR calculation.
            
        Returns:
            Tuple of VaR, asset contributions, and diversification benefit.
        """
        # Get confidence level z-score
        z_score = VaRService.CONFIDENCE_LEVELS[confidence_level]
        
        # Get time horizon factor
        time_factor = VaRService.TIME_HORIZON_FACTORS[time_horizon]
        
        # Calculate portfolio value
        portfolio_value = VaRService.calculate_portfolio_value(portfolio)
        
        # Calculate individual asset VaRs
        asset_vars = []
        for position in portfolio.positions:
            if position.volatility is None:
                # Default to a reasonable volatility if not provided
                position_volatility = 0.2  # 20% annual volatility
            else:
                position_volatility = position.volatility
            
            # Calculate position value
            position_value = position.quantity * position.price
            
            # Calculate position VaR
            position_var = position_value * position_volatility * z_score * time_factor / math.sqrt(252)
            
            asset_vars.append({
                "asset_id": position.id,
                "ticker": position.ticker,
                "asset_class": position.asset_class,
                "var": position_var,
                "position_value": position_value,
            })
        
        # Calculate undiversified VaR (sum of individual VaRs)
        undiversified_var = sum(asset["var"] for asset in asset_vars)
        
        # Create correlation matrix (default to 0.5 correlation if not provided)
        n = len(portfolio.positions)
        correlation_matrix = np.ones((n, n)) * 0.5
        np.fill_diagonal(correlation_matrix, 1.0)
        
        # Update correlation matrix with provided correlations
        for i, position_i in enumerate(portfolio.positions):
            if position_i.correlation:
                for j, position_j in enumerate(portfolio.positions):
                    if position_j.id in position_i.correlation:
                        correlation_matrix[i, j] = position_i.correlation[position_j.id]
                        correlation_matrix[j, i] = position_i.correlation[position_j.id]
        
        # Create variance-covariance matrix
        variance_vector = np.array([
            (position.volatility or 0.2) ** 2 for position in portfolio.positions
        ])
        variance_matrix = np.outer(np.sqrt(variance_vector), np.sqrt(variance_vector)) * correlation_matrix
        
        # Calculate position weights
        position_values = np.array([
            position.quantity * position.price for position in portfolio.positions
        ])
        weights = position_values / portfolio_value
        
        # Calculate portfolio variance
        portfolio_variance = weights.T @ variance_matrix @ weights
        
        # Calculate diversified VaR
        diversified_var = portfolio_value * math.sqrt(portfolio_variance) * z_score * time_factor / math.sqrt(252)
        
        # Calculate diversification benefit
        diversification_benefit = undiversified_var - diversified_var
        
        # Calculate asset contributions to diversified VaR
        asset_contributions = []
        for i, asset in enumerate(asset_vars):
            # Calculate marginal contribution to risk
            mcr = 0
            for j in range(n):
                mcr += weights[j] * variance_matrix[i, j]
            mcr = mcr / math.sqrt(portfolio_variance)
            
            # Calculate component VaR
            component_var = weights[i] * mcr * diversified_var
            
            asset_contributions.append(AssetContribution(
                asset_id=asset["asset_id"],
                ticker=asset["ticker"],
                asset_class=asset["asset_class"],
                var_contribution=component_var,
                var_contribution_percentage=(component_var / diversified_var) * 100,
            ))
        
        return diversified_var, asset_contributions, diversification_benefit
    
    @staticmethod
    def calculate_historical_var(
        portfolio: Portfolio,
        confidence_level: ConfidenceLevel,
        time_horizon: TimeHorizon,
    ) -> Tuple[float, List[AssetContribution], float, DistributionStatistics]:
        """
        Calculate VaR using the historical simulation method.
        
        Args:
            portfolio: Portfolio data.
            confidence_level: Confidence level for VaR calculation.
            time_horizon: Time horizon for VaR calculation.
            
        Returns:
            Tuple of VaR, asset contributions, diversification benefit, and distribution statistics.
        """
        # In a real implementation, this would use historical data
        # For this example, we'll simulate historical returns
        
        # Get confidence level percentile
        confidence_percentile = float(confidence_level.value.strip('%')) / 100
        
        # Get time horizon factor
        time_factor = VaRService.TIME_HORIZON_FACTORS[time_horizon]
        
        # Calculate portfolio value
        portfolio_value = VaRService.calculate_portfolio_value(portfolio)
        
        # Simulate historical returns (500 days)
        np.random.seed(42)  # For reproducibility
        num_days = 500
        returns = {}
        
        for position in portfolio.positions:
            if position.volatility is None:
                # Default to a reasonable volatility if not provided
                position_volatility = 0.2  # 20% annual volatility
            else:
                position_volatility = position.volatility
            
            # Generate daily returns with the given volatility
            daily_volatility = position_volatility / math.sqrt(252)
            position_returns = np.random.normal(0, daily_volatility, num_days)
            returns[position.id] = position_returns
        
        # Calculate portfolio returns for each historical day
        portfolio_returns = np.zeros(num_days)
        position_values = {}
        
        for position in portfolio.positions:
            position_value = position.quantity * position.price
            position_values[position.id] = position_value
            portfolio_returns += (position_value / portfolio_value) * returns[position.id]
        
        # Sort returns in ascending order (losses are negative returns)
        sorted_returns = np.sort(portfolio_returns)
        
        # Calculate VaR at the given confidence level
        var_index = int(num_days * (1 - confidence_percentile))
        var_return = -sorted_returns[var_index]  # Negative because VaR represents a loss
        var = portfolio_value * var_return * time_factor
        
        # Calculate distribution statistics
        distribution_stats = DistributionStatistics(
            mean=float(np.mean(portfolio_returns)),
            median=float(np.median(portfolio_returns)),
            standard_deviation=float(np.std(portfolio_returns)),
            skewness=float(stats.skew(portfolio_returns)),
            kurtosis=float(stats.kurtosis(portfolio_returns)),
            min=float(np.min(portfolio_returns)),
            max=float(np.max(portfolio_returns)),
        )
        
        # Calculate individual asset VaRs
        asset_vars = []
        for position in portfolio.positions:
            position_value = position_values[position.id]
            position_returns = returns[position.id]
            sorted_position_returns = np.sort(position_returns)
            position_var_return = -sorted_position_returns[var_index]
            position_var = position_value * position_var_return * time_factor
            
            asset_vars.append({
                "asset_id": position.id,
                "ticker": position.ticker,
                "asset_class": position.asset_class,
                "var": position_var,
                "position_value": position_value,
            })
        
        # Calculate undiversified VaR (sum of individual VaRs)
        undiversified_var = sum(asset["var"] for asset in asset_vars)
        
        # Calculate diversification benefit
        diversification_benefit = undiversified_var - var
        
        # Calculate asset contributions to diversified VaR
        # For historical VaR, we'll use a simple approximation based on position size and beta
        asset_contributions = []
        for asset in asset_vars:
            position_value = asset["position_value"]
            asset_returns = returns[asset["asset_id"]]
            
            # Calculate beta (correlation * std_asset / std_portfolio)
            beta = np.corrcoef(asset_returns, portfolio_returns)[0, 1] * (
                np.std(asset_returns) / np.std(portfolio_returns)
            )
            
            # Calculate component VaR
            component_var = (position_value / portfolio_value) * beta * var
            
            asset_contributions.append(AssetContribution(
                asset_id=asset["asset_id"],
                ticker=asset["ticker"],
                asset_class=asset["asset_class"],
                var_contribution=component_var,
                var_contribution_percentage=(component_var / var) * 100,
            ))
        
        return var, asset_contributions, diversification_benefit, distribution_stats
    
    @staticmethod
    def calculate_monte_carlo_var(
        portfolio: Portfolio,
        confidence_level: ConfidenceLevel,
        time_horizon: TimeHorizon,
        num_simulations: int = 10000,
    ) -> Tuple[float, List[AssetContribution], float, DistributionStatistics]:
        """
        Calculate VaR using the Monte Carlo simulation method.
        
        Args:
            portfolio: Portfolio data.
            confidence_level: Confidence level for VaR calculation.
            time_horizon: Time horizon for VaR calculation.
            num_simulations: Number of simulations to run.
            
        Returns:
            Tuple of VaR, asset contributions, diversification benefit, and distribution statistics.
        """
        # Get confidence level percentile
        confidence_percentile = float(confidence_level.value.strip('%')) / 100
        
        # Get time horizon factor
        time_factor = VaRService.TIME_HORIZON_FACTORS[time_horizon]
        
        # Calculate portfolio value
        portfolio_value = VaRService.calculate_portfolio_value(portfolio)
        
        # Create correlation matrix (default to 0.5 correlation if not provided)
        n = len(portfolio.positions)
        correlation_matrix = np.ones((n, n)) * 0.5
        np.fill_diagonal(correlation_matrix, 1.0)
        
        # Update correlation matrix with provided correlations
        for i, position_i in enumerate(portfolio.positions):
            if position_i.correlation:
                for j, position_j in enumerate(portfolio.positions):
                    if position_j.id in position_i.correlation:
                        correlation_matrix[i, j] = position_i.correlation[position_j.id]
                        correlation_matrix[j, i] = position_i.correlation[position_j.id]
        
        # Create volatility vector
        volatility_vector = np.array([
            position.volatility if position.volatility is not None else 0.2
            for position in portfolio.positions
        ])
        
        # Calculate Cholesky decomposition of correlation matrix
        cholesky = np.linalg.cholesky(correlation_matrix)
        
        # Run Monte Carlo simulations
        np.random.seed(42)  # For reproducibility
        portfolio_returns = np.zeros(num_simulations)
        asset_returns = np.zeros((n, num_simulations))
        
        for i in range(num_simulations):
            # Generate correlated random returns
            z = np.random.normal(0, 1, n)
            correlated_returns = cholesky @ z
            
            # Scale by volatility
            daily_volatility = volatility_vector / math.sqrt(252)
            scaled_returns = correlated_returns * daily_volatility
            
            # Store asset returns
            asset_returns[:, i] = scaled_returns
            
            # Calculate portfolio return
            portfolio_return = 0
            for j, position in enumerate(portfolio.positions):
                position_value = position.quantity * position.price
                portfolio_return += (position_value / portfolio_value) * scaled_returns[j]
            
            portfolio_returns[i] = portfolio_return
        
        # Sort returns in ascending order (losses are negative returns)
        sorted_returns = np.sort(portfolio_returns)
        
        # Calculate VaR at the given confidence level
        var_index = int(num_simulations * (1 - confidence_percentile))
        var_return = -sorted_returns[var_index]  # Negative because VaR represents a loss
        var = portfolio_value * var_return * time_factor
        
        # Calculate distribution statistics
        distribution_stats = DistributionStatistics(
            mean=float(np.mean(portfolio_returns)),
            median=float(np.median(portfolio_returns)),
            standard_deviation=float(np.std(portfolio_returns)),
            skewness=float(stats.skew(portfolio_returns)),
            kurtosis=float(stats.kurtosis(portfolio_returns)),
            min=float(np.min(portfolio_returns)),
            max=float(np.max(portfolio_returns)),
        )
        
        # Calculate individual asset VaRs
        asset_vars = []
        for j, position in enumerate(portfolio.positions):
            position_value = position.quantity * position.price
            position_returns = asset_returns[j, :]
            sorted_position_returns = np.sort(position_returns)
            position_var_return = -sorted_position_returns[var_index]
            position_var = position_value * position_var_return * time_factor
            
            asset_vars.append({
                "asset_id": position.id,
                "ticker": position.ticker,
                "asset_class": position.asset_class,
                "var": position_var,
                "position_value": position_value,
            })
        
        # Calculate undiversified VaR (sum of individual VaRs)
        undiversified_var = sum(asset["var"] for asset in asset_vars)
        
        # Calculate diversification benefit
        diversification_benefit = undiversified_var - var
        
        # Calculate asset contributions to diversified VaR
        asset_contributions = []
        for j, asset in enumerate(asset_vars):
            position_value = asset["position_value"]
            asset_return_series = asset_returns[j, :]
            
            # Calculate beta (correlation * std_asset / std_portfolio)
            beta = np.corrcoef(asset_return_series, portfolio_returns)[0, 1] * (
                np.std(asset_return_series) / np.std(portfolio_returns)
            )
            
            # Calculate component VaR
            component_var = (position_value / portfolio_value) * beta * var
            
            asset_contributions.append(AssetContribution(
                asset_id=asset["asset_id"],
                ticker=asset["ticker"],
                asset_class=asset["asset_class"],
                var_contribution=component_var,
                var_contribution_percentage=(component_var / var) * 100,
            ))
        
        return var, asset_contributions, diversification_benefit, distribution_stats
    
    @staticmethod
    def calculate_stress_scenarios(
        portfolio: Portfolio,
        confidence_level: ConfidenceLevel,
        time_horizon: TimeHorizon,
        base_var: float,
    ) -> List[StressScenario]:
        """
        Calculate VaR under stress scenarios.
        
        Args:
            portfolio: Portfolio data.
            confidence_level: Confidence level for VaR calculation.
            time_horizon: Time horizon for VaR calculation.
            base_var: Base VaR calculation.
            
        Returns:
            List of stress scenario results.
        """
        stress_results = []
        
        for scenario in VaRService.STRESS_SCENARIOS:
            # Create a copy of the portfolio with stressed parameters
            stressed_positions = []
            
            for position in portfolio.positions:
                # Apply asset class specific impact if available
                asset_class_multiplier = 1.0
                if "asset_class_impacts" in scenario and position.asset_class in scenario["asset_class_impacts"]:
                    asset_class_multiplier = scenario["asset_class_impacts"][position.asset_class]
                
                # Calculate stressed volatility
                stressed_volatility = None
                if position.volatility is not None:
                    stressed_volatility = position.volatility * scenario["volatility_multiplier"] * asset_class_multiplier
                
                # Create stressed correlations
                stressed_correlation = None
                if position.correlation:
                    stressed_correlation = {}
                    for asset_id, corr in position.correlation.items():
                        # Increase correlation (capped at 1.0)
                        stressed_correlation[asset_id] = min(1.0, corr + scenario["correlation_increase"])
                
                # Create stressed position
                stressed_position = Position(
                    id=position.id,
                    asset_class=position.asset_class,
                    ticker=position.ticker,
                    quantity=position.quantity,
                    price=position.price,
                    volatility=stressed_volatility,
                    correlation=stressed_correlation,
                )
                
                stressed_positions.append(stressed_position)
            
            # Create stressed portfolio
            stressed_portfolio = Portfolio(
                id=portfolio.id,
                positions=stressed_positions,
            )
            
            # Calculate VaR under stress scenario
            if len(stressed_positions) > 0:
                stressed_var, _, _, _ = VaRService.calculate_monte_carlo_var(
                    portfolio=stressed_portfolio,
                    confidence_level=confidence_level,
                    time_horizon=time_horizon,
                    num_simulations=5000,  # Fewer simulations for stress tests
                )
                
                # Calculate VaR increase
                var_increase = stressed_var - base_var
                var_increase_percentage = (var_increase / base_var) * 100
                
                # Create stress scenario result
                stress_results.append(StressScenario(
                    name=scenario["name"],
                    description=scenario["description"],
                    var=stressed_var,
                    var_increase=var_increase,
                    var_increase_percentage=var_increase_percentage,
                ))
        
        return stress_results
    
    @classmethod
    def calculate_var(cls, input_data: VaRInput) -> VaRResult:
        """
        Calculate Value at Risk (VaR).
        
        Args:
            input_data: VaR input data.
            
        Returns:
            VaR calculation result.
        """
        try:
            portfolio = input_data.portfolio
            method = input_data.method
            confidence_level = input_data.confidence_level
            time_horizon = input_data.time_horizon
            include_stress_scenarios = input_data.include_stress_scenarios
            
            # Calculate portfolio value
            portfolio_value = cls.calculate_portfolio_value(portfolio)
            
            # Calculate VaR based on the selected method
            if method == VaRMethod.PARAMETRIC:
                var, asset_contributions, diversification_benefit = cls.calculate_parametric_var(
                    portfolio=portfolio,
                    confidence_level=confidence_level,
                    time_horizon=time_horizon,
                )
                
                # Create distribution statistics for parametric method
                # For parametric, we assume normal distribution
                distribution_stats = DistributionStatistics(
                    mean=0.0,
                    median=0.0,
                    standard_deviation=0.0,  # Would be calculated from portfolio volatility
                    skewness=0.0,  # Normal distribution has zero skewness
                    kurtosis=0.0,  # Normal distribution has zero excess kurtosis
                    min=0.0,
                    max=0.0,
                )
            
            elif method == VaRMethod.HISTORICAL:
                var, asset_contributions, diversification_benefit, distribution_stats = cls.calculate_historical_var(
                    portfolio=portfolio,
                    confidence_level=confidence_level,
                    time_horizon=time_horizon,
                )
            
            elif method == VaRMethod.MONTE_CARLO:
                var, asset_contributions, diversification_benefit, distribution_stats = cls.calculate_monte_carlo_var(
                    portfolio=portfolio,
                    confidence_level=confidence_level,
                    time_horizon=time_horizon,
                    num_simulations=input_data.num_simulations,
                )
            
            else:
                raise ValueError(f"Unsupported VaR method: {method}")
            
            # Calculate VaR as percentage of portfolio value
            var_percentage = (var / portfolio_value) * 100
            
            # Calculate diversification benefit as percentage
            diversification_benefit_percentage = (diversification_benefit / (var + diversification_benefit)) * 100
            
            # Calculate stress scenarios if requested
            stress_scenarios = None
            if include_stress_scenarios:
                stress_scenarios = cls.calculate_stress_scenarios(
                    portfolio=portfolio,
                    confidence_level=confidence_level,
                    time_horizon=time_horizon,
                    base_var=var,
                )
            
            # Create and return the result
            return VaRResult(
                var=var,
                var_percentage=var_percentage,
                portfolio_value=portfolio_value,
                method=method,
                time_horizon=time_horizon,
                confidence_level=confidence_level,
                asset_contributions=asset_contributions,
                diversification_benefit=diversification_benefit,
                diversification_benefit_percentage=diversification_benefit_percentage,
                distribution_statistics=distribution_stats,
                stress_scenarios=stress_scenarios,
            )
        
        except Exception as e:
            logger.error(f"Error in VaR calculation: {str(e)}")
            raise
