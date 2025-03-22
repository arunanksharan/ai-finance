# Kuzushi Finance Tools - Financial Calculator Services

This directory contains the core business logic for the financial calculators implemented in the Kuzushi Finance Tools platform.

## 📂 Service Structure

```
services/
├── var.py            # Value at Risk calculator
├── pfe.py            # Potential Future Exposure calculator
├── saccr.py          # SA-CCR calculator
└── initial_margin.py # Initial Margin calculator
```

## 🧮 Financial Calculator Implementations

### Value at Risk (VaR) Calculator

The VaR calculator (`var.py`) implements multiple methodologies for calculating the maximum potential loss in a portfolio:

#### Methodologies

1. **Historical Simulation**
   - Uses historical returns to simulate future portfolio performance
   - Advantages: No distribution assumptions, captures fat tails
   - Implementation: Resamples historical returns and applies to current portfolio

2. **Monte Carlo Simulation**
   - Generates random scenarios based on statistical properties
   - Advantages: Flexible, can incorporate various risk factors
   - Implementation: Uses multivariate normal distribution with historical covariance

3. **Parametric Method**
   - Uses statistical parameters (mean, variance) to estimate VaR
   - Advantages: Computationally efficient, simple
   - Implementation: Assumes normal distribution of returns

#### Features

- Multiple time horizons (1-day, 10-day, 1-month, 3-month)
- Configurable confidence levels (90%, 95%, 97.5%, 99%)
- Asset contribution analysis
- Diversification benefit calculation
- Stress scenario testing
- Return distribution statistics

### Potential Future Exposure (PFE) Calculator

The PFE calculator (`pfe.py`) measures the maximum expected credit exposure over time:

#### Methodologies

1. **SA-CCR Based**
   - Uses the Standardized Approach for Counterparty Credit Risk
   - Advantages: Regulatory compliance, standardized approach
   - Implementation: Follows Basel Committee guidelines

2. **Internal Model**
   - Uses Monte Carlo simulation for future exposures
   - Advantages: More accurate, considers portfolio effects
   - Implementation: Simulates market factors and revalues trades

3. **Historical Approach**
   - Uses historical market data to estimate future exposures
   - Advantages: Based on actual market movements
   - Implementation: Applies historical scenarios to current portfolio

#### Features

- Exposure profiles over multiple time points
- Asset class breakdown
- Netting benefit analysis
- Collateral impact assessment
- Confidence level adjustments

### SA-CCR Calculator

The SA-CCR calculator (`saccr.py`) implements the Standardized Approach for Counterparty Credit Risk as defined by the Basel Committee:

#### Components

1. **Replacement Cost (RC)**
   - Current exposure to counterparty
   - Implementation: Max(V - C, 0) where V is value and C is collateral

2. **Potential Future Exposure (PFE)**
   - Potential increase in exposure
   - Implementation: Multiplier * AddOnAggregate

3. **Exposure at Default (EAD)**
   - Total exposure for capital calculation
   - Implementation: Alpha * (RC + PFE) where Alpha is 1.4

#### Features

- Support for all major asset classes (interest rate, credit, equity, commodity, FX)
- Implementation of supervisory factors and correlation parameters
- Maturity factor adjustments
- Collateral recognition
- Netting set calculations

### Initial Margin Calculator

The Initial Margin calculator (`initial_margin.py`) determines margin requirements for non-cleared derivatives:

#### Methodologies

1. **Grid/Schedule Approach**
   - Based on BCBS-IOSCO framework
   - Advantages: Simple, transparent, regulatory compliance
   - Implementation: Applies standardized percentages to notional amounts

2. **ISDA SIMM**
   - Model-based approach with risk sensitivities
   - Advantages: More risk-sensitive, industry standard
   - Implementation: Calculates delta, vega, and curvature risk components

#### Features

- Support for all major asset classes
- Netting within asset classes
- Collateral recognition
- Risk sensitivity calculations for SIMM
- Correlation adjustments

## 🧪 Testing

Each calculator service includes comprehensive unit tests to verify the accuracy of calculations:

- **Test Data**: Sample portfolios, netting sets, and trades
- **Benchmark Results**: Comparison with industry benchmarks
- **Edge Cases**: Testing of extreme market conditions
- **Performance Tests**: Evaluation of calculation speed for large portfolios

## 📚 Implementation Details

### Value at Risk (VaR)

```python
class VaRCalculator:
    def __init__(self, portfolio, params):
        self.portfolio = portfolio
        self.params = params
        
    def calculate(self):
        if self.params.methodology == "historical":
            return self._calculate_historical()
        elif self.params.methodology == "monte_carlo":
            return self._calculate_monte_carlo()
        elif self.params.methodology == "parametric":
            return self._calculate_parametric()
        
    def _calculate_historical(self):
        # Implementation of historical simulation
        pass
        
    def _calculate_monte_carlo(self):
        # Implementation of Monte Carlo simulation
        pass
        
    def _calculate_parametric(self):
        # Implementation of parametric method
        pass
        
    def calculate_asset_contributions(self):
        # Calculate contribution of each asset to total VaR
        pass
        
    def calculate_stress_scenarios(self):
        # Apply stress scenarios to the portfolio
        pass
```

### Potential Future Exposure (PFE)

```python
class PFECalculator:
    def __init__(self, netting_set, params):
        self.netting_set = netting_set
        self.params = params
        
    def calculate(self):
        if self.params.methodology == "saccr":
            return self._calculate_saccr_based()
        elif self.params.methodology == "internal_model":
            return self._calculate_internal_model()
        elif self.params.methodology == "historical":
            return self._calculate_historical()
        
    def _calculate_saccr_based(self):
        # Implementation of SA-CCR based PFE
        pass
        
    def _calculate_internal_model(self):
        # Implementation of internal model PFE
        pass
        
    def _calculate_historical(self):
        # Implementation of historical PFE
        pass
        
    def calculate_exposure_profile(self):
        # Calculate exposure over time
        pass
```

### SA-CCR

```python
class SACCRCalculator:
    def __init__(self, netting_set):
        self.netting_set = netting_set
        
    def calculate(self):
        rc = self.calculate_replacement_cost()
        pfe = self.calculate_potential_future_exposure()
        ead = 1.4 * (rc + pfe)  # Alpha = 1.4
        
        return {
            "replacement_cost": rc,
            "potential_future_exposure": pfe,
            "exposure_at_default": ead,
            "asset_class_breakdown": self.calculate_asset_class_breakdown(),
            "transaction_results": self.calculate_transaction_results()
        }
        
    def calculate_replacement_cost(self):
        # Implementation of replacement cost calculation
        pass
        
    def calculate_potential_future_exposure(self):
        # Implementation of PFE calculation
        pass
        
    def calculate_asset_class_breakdown(self):
        # Calculate exposure by asset class
        pass
        
    def calculate_transaction_results(self):
        # Calculate results for each transaction
        pass
```

### Initial Margin

```python
class InitialMarginCalculator:
    def __init__(self, netting_sets, calculation_method):
        self.netting_sets = netting_sets
        self.calculation_method = calculation_method
        
    def calculate(self):
        if self.calculation_method == "grid":
            return self._calculate_grid_approach()
        elif self.calculation_method == "simm":
            return self._calculate_simm_approach()
        
    def _calculate_grid_approach(self):
        # Implementation of Grid/Schedule Approach
        pass
        
    def _calculate_simm_approach(self):
        # Implementation of ISDA SIMM
        pass
        
    def calculate_asset_class_breakdown(self):
        # Calculate margin by asset class
        pass
        
    def calculate_sensitivity_breakdown(self):
        # Calculate margin by risk sensitivity (for SIMM)
        pass
```

## 🔍 Code Quality Guidelines

1. **Performance Optimization**:
   - Use vectorized operations with NumPy and Pandas
   - Implement caching for repeated calculations
   - Consider parallel processing for Monte Carlo simulations

2. **Numerical Stability**:
   - Handle edge cases (zero values, extreme market moves)
   - Use appropriate numerical precision
   - Implement checks for numerical stability

3. **Documentation**:
   - Include detailed docstrings for all methods
   - Document the mathematical formulas used
   - Provide references to regulatory documents

4. **Error Handling**:
   - Validate all inputs before calculation
   - Provide meaningful error messages
   - Log calculation steps for debugging

## 📚 References

### Value at Risk (VaR)
- Jorion, P. (2006). Value at Risk: The New Benchmark for Managing Financial Risk.
- Hull, J. C. (2018). Options, Futures, and Other Derivatives.

### Potential Future Exposure (PFE)
- Gregory, J. (2015). The xVA Challenge: Counterparty Credit Risk, Funding, Collateral, and Capital.
- Pykhtin, M., & Zhu, S. (2007). A Guide to Modeling Counterparty Credit Risk.

### SA-CCR
- Basel Committee on Banking Supervision (2014). The standardized approach for measuring counterparty credit risk exposures.
- Basel Committee on Banking Supervision (2019). SA-CCR: Explanatory note.

### Initial Margin
- BCBS-IOSCO (2015). Margin requirements for non-centrally cleared derivatives.
- ISDA (2020). ISDA SIMM Methodology, version 2.3.
