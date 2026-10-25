/* Plano Premium: conforto no dia a dia, nunca força. Por enquanto local (o servidor e o Pix decidem depois).
   O interruptor de teste só aparece para o dev (servidor de desenvolvimento do Vite). */
const KEY = 'karmika.premium';
let on = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
const subs: ((v: boolean) => void)[] = [];
export const isPremium = () => on;
export function setPremium(v: boolean) { on = v; try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* */ } for (const f of subs) f(v); }
export const onPremium = (f: (v: boolean) => void) => { subs.push(f); };
/** limites do plano */
export const questLimit = () => (on ? 10 : 5);
export const GIFT_BAG = 36; // bolsa de presente enquanto o Premium estiver ativo
export const IS_DEV = !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
/** dias de Premium: usar um Selo de Marghar soma dias ao que já existe (o interruptor do dev não tem data) */
const UNTIL = 'karmika.premium.until';
export const premiumUntil = () => { try { return +(localStorage.getItem(UNTIL) || 0); } catch { return 0; } };
export function addPremiumDays(days: number) { const base = Math.max(Date.now(), premiumUntil()); try { localStorage.setItem(UNTIL, String(base + days * 864e5)); } catch { /* */ } setPremium(true); }
/** confere se o Premium comprado acabou */
export function checkPremiumExpiry() { const u = premiumUntil(); if (u && Date.now() > u && on) { try { localStorage.removeItem(UNTIL); } catch { /* */ } setPremium(false); } }
