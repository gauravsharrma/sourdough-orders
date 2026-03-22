import { db } from "@/db";
import { settings } from "@/db/schema";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const allSettings = await db.select().from(settings).all();
  const settingsMap: Record<string, string> = {};
  for (const s of allSettings) {
    settingsMap[s.key] = s.value;
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/whatsapp`;

  return (
    <div>
      <Header title="Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SettingsForm settings={settingsMap} />

        <div className="space-y-6">
          <Card title="WhatsApp Webhook URL">
            <p className="text-sm text-stone-500 mt-2 mb-2">
              Copy this URL into your Meta Developer Console webhook configuration:
            </p>
            <code className="block bg-stone-100 rounded-lg p-3 text-sm break-all">
              {webhookUrl}
            </code>
          </Card>

          <Card title="Stripe Webhook URL">
            <p className="text-sm text-stone-500 mt-2 mb-2">
              Add this endpoint in your Stripe Dashboard under Webhooks:
            </p>
            <code className="block bg-stone-100 rounded-lg p-3 text-sm break-all">
              {`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/stripe`}
            </code>
            <p className="text-sm text-stone-500 mt-2">
              Subscribe to: <code>checkout.session.completed</code>
            </p>
          </Card>

          <Card title="Setup Guide">
            <div className="mt-2 text-sm text-stone-600 space-y-3">
              <div>
                <h4 className="font-medium">1. WhatsApp Business API</h4>
                <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                  <li>Create an app at developers.facebook.com</li>
                  <li>Add the WhatsApp product</li>
                  <li>Get your Phone Number ID and Access Token</li>
                  <li>Set webhook URL above with your verify token</li>
                  <li>Subscribe to &quot;messages&quot; webhook field</li>
                  <li>Use ngrok for local testing</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium">2. Stripe</h4>
                <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                  <li>Get API keys from dashboard.stripe.com</li>
                  <li>Install Stripe CLI for local webhook testing</li>
                  <li>Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe</li>
                  <li>Add webhook endpoint in production</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
