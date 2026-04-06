"use client";

import { Settings, User, Bell, Shield, Palette, Database, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components";

const settingsSections = [
  {
    icon: User,
    title: "Account",
    description: "Manage your profile, email address, and login preferences.",
    status: "Coming soon",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure Telegram bot alerts and reconciliation notifications.",
    status: "Coming soon",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Update your password and manage active sessions.",
    status: "Coming soon",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customise the dashboard theme and display preferences.",
    status: "Coming soon",
  },
  {
    icon: Database,
    title: "Data & Integrations",
    description: "Manage Supabase connection, export schedules, and API access.",
    status: "Coming soon",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col p-6 lg:p-8 w-full bg-white min-h-screen">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and application preferences"
      />

      <div className="mt-6 grid grid-cols-1 gap-3 max-w-2xl">
        {settingsSections.map(({ icon: Icon, title, description, status }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Icon className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-[#0a0a0a]">{title}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 uppercase tracking-wide">
                  {status}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" strokeWidth={1.5} />
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-2xl p-5 rounded-2xl border border-gray-100 bg-gray-50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">System Info</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Backend: Render (FastAPI) · Frontend: Vercel (Next.js) · Database: Supabase
        </p>
      </div>
    </div>
  );
}
