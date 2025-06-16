import { redirect } from 'next/navigation';

// Remove edge runtime
// export const runtime = 'edge';

export default function TradePage() {
  // Define the default trading pair
  const defaultPair = 'AAPL-usd';
  
  // Redirect to the default pair page
  redirect(`/trade/${defaultPair}`);
} 