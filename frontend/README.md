# Kuzushi Finance Tools - Frontend

The frontend component of the Kuzushi Finance Tools platform, built with Next.js, TypeScript, and Tailwind CSS, providing a modern and responsive user interface for financial calculations.

## 🌟 Overview

This Next.js application serves as the user interface for the Kuzushi Finance Tools platform. It provides intuitive forms and visualizations for various financial calculators, including Value at Risk (VaR), Potential Future Exposure (PFE), SA-CCR, and Initial Margin.

## 🧰 Key Features

- **Financial Calculators**:
  - Value at Risk (VaR) calculator with portfolio management
  - Potential Future Exposure (PFE) calculator with netting sets
  - SA-CCR calculator for counterparty credit risk
  - Initial Margin calculator with Grid and SIMM approaches
- **Interactive UI**:
  - Form-based inputs with validation
  - CSV upload for batch calculations
  - Data visualization with charts and tables
  - Responsive design for all devices
- **Modern Tech Stack**:
  - Next.js with App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - shadcn UI for component library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the variables with your configuration, particularly the API URL

### Running the Application

Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

Build the application for production:
```bash
npm run build
# or
yarn build
```

Start the production server:
```bash
npm run start
# or
yarn start
```

## 📂 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/                    # Source code
│   ├── app/                # Next.js app router
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   ├── var-calculator/ # VaR calculator pages
│   │   ├── pfe-calculator/ # PFE calculator pages
│   │   ├── saccr-calculator/ # SA-CCR calculator pages
│   │   └── initial-margin-calculator/ # IM calculator pages
│   ├── components/         # React components
│   │   ├── ui/             # UI components from shadcn
│   │   ├── var/            # VaR-specific components
│   │   ├── pfe/            # PFE-specific components
│   │   ├── saccr/          # SA-CCR-specific components
│   │   └── initial-margin/ # Initial Margin components
│   ├── lib/                # Utility functions
│   │   ├── constants.ts    # Application constants
│   │   ├── utils.ts        # Helper functions
│   │   └── api.ts          # API client
│   └── styles/             # CSS styles
├── .env.local              # Environment variables
├── .env.example            # Example environment variables
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Node.js dependencies
└── README.md               # Documentation
```

## 📊 Financial Calculators

### Value at Risk (VaR) Calculator
- Input portfolio positions with asset classes and weights
- Select calculation methodology (Historical, Monte Carlo, Parametric)
- Configure time horizon and confidence level
- View results with asset contribution analysis and stress scenarios

### Potential Future Exposure (PFE) Calculator
- Define netting sets with counterparty information
- Add trades with various asset classes and attributes
- Select calculation methodology
- Visualize exposure profiles and asset class breakdowns

### SA-CCR Calculator
- Input netting set information and transactions
- Support for different asset classes and transaction types
- CSV upload for batch calculations
- Detailed results with asset class breakdown and transaction details

### Initial Margin Calculator
- Choose between Grid/Schedule Approach and ISDA SIMM
- Add trades with relevant risk sensitivities for SIMM
- CSV upload for batch calculations
- Visualize results with asset class breakdown and sensitivity analysis

## 🔧 Technologies

- **Next.js**: React framework for production
- **TypeScript**: Typed JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn UI**: Component library based on Radix UI
- **Recharts**: Composable charting library
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **Axios**: HTTP client

## 🔒 Environment Variables

The application requires the following environment variables:

```
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication
NEXT_PUBLIC_AUTH_ENABLED=true
```

## 🧪 Testing

Run the test suite:
```bash
npm run test
# or
yarn test
```

For component testing:
```bash
npm run test:component
# or
yarn test:component
```

## 🎨 UI Components

The application uses shadcn UI, a collection of reusable components built on top of Tailwind CSS and Radix UI. Key components include:

- **Form Components**: Input fields, select dropdowns, radio buttons
- **Data Display**: Tables, cards, tabs
- **Feedback**: Toast notifications, loading indicators
- **Layout**: Responsive grid and flex layouts
- **Navigation**: Tabs, breadcrumbs

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

Layout adjustments are made using Tailwind CSS breakpoints to ensure optimal user experience across all screen sizes.

## 🔍 Code Quality

Maintain code quality with:
```bash
# Linting
npm run lint
# or
yarn lint

# Type checking
npm run type-check
# or
yarn type-check
```

## 📈 Data Visualization

The application uses Recharts for data visualization, including:
- Bar charts for asset class breakdowns
- Pie charts for portfolio allocation
- Line charts for time series data
- Area charts for exposure profiles

## 🔄 API Integration

The frontend communicates with the backend API using Axios. API calls are organized in the `src/lib/api.ts` file, with separate functions for each calculator:

- `calculateVaR`: Calculate Value at Risk
- `calculatePFE`: Calculate Potential Future Exposure
- `calculateSACCR`: Calculate SA-CCR
- `calculateInitialMargin`: Calculate Initial Margin

Each function handles error cases and returns typed responses.
