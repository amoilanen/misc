import { useRouter } from 'next/router';
import { Button, ButtonGroup } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { setUserPreferredLanguage } from '../utils/language';

export default function LanguageSwitcher() {
  const router = useRouter();
  const { i18n } = useTranslation();

  const changeLanguage = (locale: string) => {
    const { pathname, asPath, query } = router;
    // Store the user's language preference
    setUserPreferredLanguage(locale as 'en' | 'fi');
    // Update the URL and locale
    router.push({ pathname, query }, asPath, { locale });
  };

  return (
    <ButtonGroup size="small" aria-label="language selector">
      <Button
        onClick={() => changeLanguage('en')}
        variant={i18n.language === 'en' ? 'contained' : 'outlined'}
      >
        EN
      </Button>
      <Button
        onClick={() => changeLanguage('fi')}
        variant={i18n.language === 'fi' ? 'contained' : 'outlined'}
      >
        FI
      </Button>
    </ButtonGroup>
  );
} 