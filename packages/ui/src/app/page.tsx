import { redirect } from 'next/navigation';

// Remove edge runtime
// export const runtime = 'edge';

export default function Home() {
  redirect('/trade');
}
