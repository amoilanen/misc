# Car Information Search Application

A modern web application for searching car information from Finnish public registries. Built with Next.js, TypeScript, and Material-UI.

## Features

- Search car information by license plate
- View basic car information for free
- Access detailed information (owner history, service history) with payment
- Generate and send PDF invoices
- Mobile-responsive design
- Secure payment processing via PayPal

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- PayPal Developer account (for testing)
- Google Cloud Platform account (for deployment)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_ID=your_company_id
COMPANY_VAT_ID=your_vat_id
COMPANY_BANK_ACCOUNT=your_bank_account

# GCP Configuration (for deployment)
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run the test suite:
```bash
npm run test
# or
yarn test
```

For coverage report:
```bash
npm run test:coverage
# or
yarn test:coverage
```

## PayPal Sandbox Setup

1. Create a PayPal Developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create a new app in the PayPal Developer Dashboard
3. Get your sandbox client ID and secret
4. Add them to your `.env.local` file
5. Use the PayPal sandbox test accounts for testing payments

## Deployment to GCP

1. Install and initialize the Google Cloud SDK
2. Set up your GCP project and enable necessary APIs
3. Deploy using the following command:
   ```bash
   npm run build
   gcloud app deploy
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Next.js pages and API routes
├── hooks/         # Custom React hooks
├── services/      # API and external service integrations
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── styles/        # Global styles and theme configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 