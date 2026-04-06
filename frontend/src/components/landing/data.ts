import { Megaphone, Bot, Landmark, HandCoins, BarChart3, RefreshCw, LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  desc: string
}

export interface Step {
  num: string
  title: string
  desc: string
}

export interface Stat {
  value: string
  label: string
}

export const features: Feature[] = [
  {
    icon: Megaphone,
    title: 'Campaign Management',
    desc: 'Create, assign, and monitor refund campaigns with real-time status tracking from a single view.',
  },
  {
    icon: Bot,
    title: 'Telegram Order Bot',
    desc: 'AI-powered bot parses Amazon order messages forwarded from WhatsApp — zero manual entry.',
  },
  {
    icon: Landmark,
    title: 'Bank Reconciliation',
    desc: 'Upload bank statements and watch credits auto-match to pending campaigns within seconds.',
  },
  {
    icon: HandCoins,
    title: 'Automated Settlements',
    desc: 'Settlements are triggered and logged automatically the moment a credit matches a campaign.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: "Get a birds-eye view of all campaigns, order volumes, and settlement statuses in real time.",
  },
  {
    icon: RefreshCw,
    title: 'Smart Sync',
    desc: 'Bank credits, order history, and campaign statuses stay in sync — always up to date.',
  },
]

export const steps: Step[] = [
  {
    num: '1',
    title: 'Connect your Telegram bot',
    desc: 'Forward Amazon order confirmations to your bot. Our AI parses them instantly.',
  },
  {
    num: '2',
    title: 'Create a campaign',
    desc: 'Set expected refund amounts, assign to team members, and start tracking.',
  },
  {
    num: '3',
    title: 'Upload bank statement',
    desc: 'Drop in your bank CSV. The engine matches credits to campaigns automatically.',
  },
  {
    num: '4',
    title: 'Review & settle',
    desc: 'Get alerts, approve settlements, and keep a clean ledger — all in one place.',
  },
]

export const stats: Stat[] = [
  { value: '₹0', label: 'Manual reconciliation cost' },
  { value: '<2s', label: 'Order ingestion time' },
  { value: '100%', label: 'Automated matching' },
  { value: '∞', label: 'Campaigns supported' },
]
