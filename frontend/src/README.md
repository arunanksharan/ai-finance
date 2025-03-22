# Kuzushi Finance Tools - Frontend Source Code

This directory contains the source code for the Kuzushi Finance Tools frontend application.

## 📂 Directory Structure

```
src/
├── app/                # Next.js app router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   ├── var-calculator/ # VaR calculator pages
│   ├── pfe-calculator/ # PFE calculator pages
│   ├── saccr-calculator/ # SA-CCR calculator pages
│   └── initial-margin-calculator/ # IM calculator pages
├── components/         # React components
│   ├── ui/             # UI components from shadcn
│   ├── var/            # VaR-specific components
│   ├── pfe/            # PFE-specific components
│   ├── saccr/          # SA-CCR-specific components
│   └── initial-margin/ # Initial Margin components
├── lib/                # Utility functions
│   ├── constants.ts    # Application constants
│   ├── utils.ts        # Helper functions
│   └── api.ts          # API client
└── styles/             # CSS styles
```

## 🔑 Key Components

### App Router (app/)

The application uses Next.js App Router for routing and page organization:

- **layout.tsx**: Root layout with common UI elements
- **page.tsx**: Home page with navigation to calculators
- **var-calculator/**: Value at Risk calculator pages
- **pfe-calculator/**: Potential Future Exposure calculator pages
- **saccr-calculator/**: SA-CCR calculator pages
- **initial-margin-calculator/**: Initial Margin calculator pages

Each calculator directory follows a similar structure:
- **page.tsx**: Main calculator page with form and results
- **loading.tsx**: Loading state component
- **error.tsx**: Error handling component

### Components (components/)

Reusable React components organized by functionality:

- **ui/**: shadcn UI components (buttons, inputs, cards, etc.)
- **var/**: VaR-specific components
  - **portfolio-table.tsx**: Portfolio management table
  - **var-results-display.tsx**: Results visualization
- **pfe/**: PFE-specific components
  - **netting-set-form.tsx**: Netting set input form
  - **trade-table.tsx**: Trade management table
  - **pfe-results-display.tsx**: Results visualization
- **saccr/**: SA-CCR-specific components
  - **transaction-table.tsx**: Transaction management table
  - **saccr-results-display.tsx**: Results visualization
- **initial-margin/**: Initial Margin components
  - **trade-table.tsx**: Trade management table
  - **initial-margin-results-display.tsx**: Results visualization

### Library (lib/)

Utility functions and constants:

- **constants.ts**: Application-wide constants (API URLs, etc.)
- **utils.ts**: Helper functions for formatting, calculations, etc.
- **api.ts**: API client functions for backend communication

### Styles (styles/)

Global CSS styles and Tailwind CSS configuration.

## 📊 Financial Calculator Components

### Value at Risk (VaR) Calculator

The VaR calculator allows users to assess portfolio risk using different methodologies:

- **Form Components**:
  - Methodology selection (Historical, Monte Carlo, Parametric)
  - Time horizon selection (1-day, 10-day, 1-month, 3-month)
  - Confidence level selection (90%, 95%, 97.5%, 99%)
  - Portfolio management with asset class and weight inputs

- **Results Components**:
  - VaR calculation results with confidence intervals
  - Asset contribution analysis
  - Stress scenario testing
  - Return distribution statistics

### Potential Future Exposure (PFE) Calculator

The PFE calculator measures credit exposure over time:

- **Form Components**:
  - Netting set information
  - Trade inputs with asset class, type, and notional
  - Calculation methodology selection
  - Time horizon configuration

- **Results Components**:
  - Exposure profile visualization
  - Asset class breakdown
  - Netting benefit analysis
  - Collateral impact assessment

### SA-CCR Calculator

The SA-CCR calculator implements the Standardized Approach for Counterparty Credit Risk:

- **Form Components**:
  - Netting set information with counterparty details
  - Transaction inputs with asset class, type, notional, and maturity
  - CSV upload for batch calculations

- **Results Components**:
  - Replacement Cost (RC) display
  - Potential Future Exposure (PFE) display
  - Exposure at Default (EAD) calculation
  - Asset class breakdown visualization
  - Transaction-level results

### Initial Margin Calculator

The Initial Margin calculator determines margin requirements for non-cleared derivatives:

- **Form Components**:
  - Calculation method selection (Grid/Schedule or SIMM)
  - Netting set configuration
  - Trade inputs with asset class, product, and notional
  - Sensitivity inputs for SIMM (delta, vega, curvature)
  - CSV upload for batch calculations

- **Results Components**:
  - Total margin display
  - Asset class breakdown visualization
  - Sensitivity breakdown for SIMM
  - Netting set details

## 🚀 Development Guidelines

1. **Component Organization**:
   - Keep components focused and single-purpose
   - Use composition for complex UIs
   - Implement proper prop typing with TypeScript

2. **State Management**:
   - Use React Hook Form for form state
   - Implement Zod schemas for validation
   - Keep state as local as possible

3. **Styling**:
   - Use Tailwind CSS for styling
   - Follow the shadcn UI component patterns
   - Ensure responsive design for all components

4. **API Integration**:
   - Use Axios for API calls
   - Implement proper error handling
   - Show loading states during API calls

5. **Accessibility**:
   - Ensure proper keyboard navigation
   - Include appropriate ARIA attributes
   - Test with screen readers

## 📱 Responsive Design

All components are designed to be responsive across different screen sizes:

- **Desktop**: Full layout with side-by-side forms and results
- **Tablet**: Adjusted layout with stacked sections
- **Mobile**: Simplified layout with focused UI elements

## 🔍 Code Quality

Maintain code quality with:

- **TypeScript**: Strict typing for all components and functions
- **ESLint**: Code linting for consistency
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **React Testing Library**: Component testing
