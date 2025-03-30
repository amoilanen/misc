import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { getInitialLocale } from '../utils/language';
import { useCarSearchStore } from '../store/carSearchStore';
import { useCarSearch } from '../hooks/useCarSearch';

export default function Search() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { plate } = router.query;
  
  const {
    carInfo,
    isLoading,
    error,
    email,
    showPayment,
    paymentError,
    showDetailedInfo,
    setEmail,
    setShowPayment,
    setPaymentError,
  } = useCarSearchStore();

  const { handlePaymentSuccess } = useCarSearch(plate);

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (!carInfo) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="info">{t('noResults')}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            {t('title')}
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('basicInfo')}
            </Typography>
            <Typography>{t('licensePlate')}: {carInfo.licensePlate}</Typography>
            <Typography>{t('make')}: {carInfo.make}</Typography>
            <Typography>{t('model')}: {carInfo.model}</Typography>
            <Typography>{t('year')}: {carInfo.year}</Typography>
            <Typography>{t('color')}: {carInfo.color}</Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('registrationDetails')}
            </Typography>
            <Typography>{t('registrationDate')}: {carInfo.basicInfo.registrationDate}</Typography>
            <Typography>{t('lastInspection')}: {carInfo.basicInfo.lastInspection}</Typography>
            <Typography>{t('status')}: {carInfo.basicInfo.status}</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {!showDetailedInfo ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('detailedInfo')}
              </Typography>
              <Typography paragraph>
                {t('detailedInfoDescription')}
                <br />
                {t('price', { price: '29.99' })}
              </Typography>
              <Button
                variant="contained"
                onClick={() => setShowPayment(true)}
                sx={{ mb: 2 }}
              >
                {t('purchase')}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('detailedInfo')}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                {t('ownerHistory')}
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('name')}</TableCell>
                      <TableCell>{t('registrationDate')}</TableCell>
                      <TableCell>{t('deregistrationDate')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carInfo.detailedInfo.ownerHistory.map((owner, index) => (
                      <TableRow key={index}>
                        <TableCell>{owner.name}</TableCell>
                        <TableCell>{owner.registrationDate}</TableCell>
                        <TableCell>{owner.deregistrationDate || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" gutterBottom>
                {t('serviceHistory')}
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('date')}</TableCell>
                      <TableCell>{t('description')}</TableCell>
                      <TableCell>{t('mileage')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carInfo.detailedInfo.serviceHistory.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell>{service.date}</TableCell>
                        <TableCell>{service.description}</TableCell>
                        <TableCell>{service.mileage} km</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {showPayment && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                {t('completePurchase')}
              </Typography>
              <TextField
                fullWidth
                label={t('email')}
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Trigger PayPal payment flow
                    const paypalButtons = document.querySelector('.paypal-buttons-container');
                    if (paypalButtons) {
                      const purchaseButton = paypalButtons.querySelector('button');
                      if (purchaseButton) {
                        purchaseButton.click();
                      }
                    }
                  }
                }}
                sx={{ mb: 2 }}
              />
              {paymentError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {t('paymentError')}
                </Alert>
              )}
              <PayPalButtons
                createOrder={(data: any, actions: any) => {
                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          value: '29.99',
                        },
                        description: `${t('detailedInfo')} - ${carInfo.licensePlate}`,
                      },
                    ],
                  });
                }}
                onApprove={async (data: any, actions: any) => {
                  if (actions.order) {
                    await actions.order.capture();
                    await handlePaymentSuccess(email);
                  }
                }}
                onError={(err: any) => {
                  setPaymentError(t('paymentError'));
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const locale = getInitialLocale(context);
  
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}; 