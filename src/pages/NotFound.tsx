import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className={`text-center px-4 ${isRTL ? 'font-arabic' : ''}`}>
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
        <p className="text-2xl text-foreground mb-2">{t('notFound.title')}</p>
        <p className="text-muted-foreground mb-8">{t('notFound.description')}</p>
        <Button asChild>
          <Link to="/" className={`inline-flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Home className="h-4 w-4" />
            {t('notFound.returnHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
