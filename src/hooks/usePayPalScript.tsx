
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const usePayPalScript = () => {
  const [paypalScriptLoaded, setPaypalScriptLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (paypalScriptLoaded || window.paypal) {
      setPaypalScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=AU15djn3gU9YlY__yWU0ZFAGCo8AepH1KSx2I5Kr_0YrgktGrApSOcI-yAaeAFmfHDN4-yWUu2V1NHqV&currency=USD`;
    script.onload = () => setPaypalScriptLoaded(true);
    script.onerror = () => {
      toast({
        title: "PayPal Error",
        description: "Failed to load PayPal SDK",
        variant: "destructive"
      });
    };
    document.body.appendChild(script);
  }, [paypalScriptLoaded, toast]);

  return paypalScriptLoaded;
};
