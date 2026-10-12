// Small identifying marks: chain symbols (simplified, drawn here as inline SVG, no third-party files)
// and provider badges (a logo from site/logos/<slug>.<ext> when one is committed, otherwise initials).
import { existsSync } from 'node:fs';

const svg = (body, label) => `<svg class="mark" viewBox="0 0 16 16" width="14" height="14" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
const disc = (fill, text, ink = '#fff', size = 8) => `<circle cx="8" cy="8" r="8" fill="${fill}"/><text x="8" y="8" dy="0.36em" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${size}" fill="${ink}">${text}</text>`;
const MARKS = {
  eth: ['Ethereum', '<path d="M8 1 3.5 8.2 8 10.8l4.5-2.6z" fill="#627EEA"/><path d="M8 11.7 3.5 9.1 8 15l4.5-5.9z" fill="#8FA4F0"/>'],
  base: ['Base', '<rect width="16" height="16" rx="3.5" fill="#0052FF"/>'],
  op: ['OP Mainnet', disc('#FF0420', 'OP', '#fff', 6.5)],
  arb: ['Arbitrum One', '<path d="M8 .8 14.3 4.4v7.2L8 15.2 1.7 11.6V4.4z" fill="#213147"/><path d="m6.2 11.4 3-7h1.4l-3 7zm2.6 0 2-4.6.8 1.8-1.2 2.8z" fill="#12AAFF"/>'],
  gnosis: ['Gnosis Chain', disc('#3E6957', 'G')],
  avax: ['Avalanche C-Chain', '<circle cx="8" cy="8" r="8" fill="#E84142"/><path d="M8 3.6 12 11H4z" fill="#fff"/>'],
  bnb: ['BNB Chain', '<rect x="3.2" y="3.2" width="9.6" height="9.6" rx="1" transform="rotate(45 8 8)" fill="#F0B90B"/><rect x="6.3" y="6.3" width="3.4" height="3.4" transform="rotate(45 8 8)" fill="#fff"/>'],
  linea: ['Linea', '<rect width="16" height="16" rx="3" fill="#121212"/><path d="M5 3.5h1.6v7.4H11v1.6H5z" fill="#fff"/>'],
  plasma: ['Plasma', disc('#162F29', 'P', '#7BE0B5')],
  sol: ['Solana', '<rect width="16" height="16" rx="3.5" fill="#111"/><path d="M4.6 4.2h8l-1.4 1.6h-8zm0 3h8l-1.4 1.6h-8zm1.4 3h8L12.6 11.8h-8z" fill="#14F195"/>'],
  starknet: ['Starknet', disc('#0C0C4F', 'S', '#FF875B')],
  aleo: ['Aleo', disc('#111', 'A', '#fff')],
  aztec: ['Aztec', '<path d="M8 1.5 14.5 8 8 14.5 1.5 8z" fill="#2F1F49"/><path d="M8 5 11 8 8 11 5 8z" fill="#D4FF28"/>'],
  monero: ['Monero', disc('#FF6600', 'M')],
  zcash: ['Zcash', disc('#F4B728', 'Z', '#231F20')],
  offchain: ['Off-chain', '<circle cx="8" cy="8" r="7" fill="none" stroke="#8a93a3" stroke-width="1.5" stroke-dasharray="2.5 2"/>'],
};
const BY_ID = { 1: 'eth', 10: 'op', 100: 'gnosis', 42161: 'arb', 43114: 'avax', 56: 'bnb', 59144: 'linea', 8453: 'base', 9745: 'plasma' };
const BY_NS = { solana: 'sol', starknet: 'starknet', aleo: 'aleo', aztec: 'aztec', monero: 'monero', zcash: 'zcash' };

export function chainMark(chain) {
  const key = !chain ? 'offchain' : BY_ID[chain.chain_id] ?? BY_NS[String(chain.caip2 ?? '').split(':')[0]];
  if (!key) return '';
  const [label, body] = MARKS[key];
  return svg(body, label);
}

const LOGO_EXT = ['svg', 'png', 'webp'];
export const logoFile = (slug) => LOGO_EXT.map((x) => `site/logos/${slug}.${x}`).find(existsSync) ?? null;
const initials = (name) => name.replace(/\(.*?\)/g, '').split(/[\s-]+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// `esc` is passed in so this module does not duplicate the build's escaping.
export function providerMark(p, up, esc) {
  const f = logoFile(p.slug);
  if (f) return `<img class="plogo" src="${up}logos/${esc(f.split('/').pop())}" width="20" height="20" alt="" loading="lazy">`;
  return `<span class="plogo mono" aria-hidden="true">${esc(initials(p.name))}</span>`;
}

export const ALL_CHAIN_KEYS = Object.keys(MARKS);
