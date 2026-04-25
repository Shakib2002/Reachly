import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    stripeInstance = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
  }
  return stripeInstance;
}

export const PLANS = {
  free: { name: 'Free', price: 0, priceAnnual: 0, priceId: '', priceIdAnnual: '' },
  pro: { name: 'Pro', price: 29, priceAnnual: 23, priceId: process.env.STRIPE_PRO_PRICE_ID || '', priceIdAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '' },
  team: { name: 'Team', price: 79, priceAnnual: 63, priceId: process.env.STRIPE_TEAM_PRICE_ID || '', priceIdAnnual: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || '' },
} as const;
