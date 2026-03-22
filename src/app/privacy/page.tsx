export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-stone-500 mb-6">Last updated: March 22, 2026</p>

      <div className="space-y-4 text-stone-700">
        <section>
          <h2 className="font-semibold text-lg mb-2">Information We Collect</h2>
          <p>When you place an order via WhatsApp, we collect your phone number, name (from your WhatsApp profile), order details, and pickup preferences. Payment is processed securely through Stripe — we do not store your payment card details.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">How We Use Your Information</h2>
          <p>We use your information solely to process and fulfill your bakery orders, send order confirmations and status updates via WhatsApp, and process payments through Stripe.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">Data Sharing</h2>
          <p>We do not sell or share your personal information with third parties. Your data is shared only with WhatsApp (Meta) for messaging and Stripe for payment processing, as necessary to fulfill your orders.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">Data Retention</h2>
          <p>We retain your order history and contact information for as long as needed to provide our services. You can request deletion of your data at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg mb-2">Contact</h2>
          <p>For any privacy-related questions, please message us on WhatsApp or email us at gaurav1000@gmail.com.</p>
        </section>
      </div>
    </div>
  );
}
