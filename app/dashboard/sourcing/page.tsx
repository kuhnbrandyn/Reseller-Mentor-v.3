"use client";

export default function SourcingTipsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold text-[#E4B343] mb-4">
        Pro Sourcing Tips
      </h1>
      <p className="text-gray-400 mb-8 max-w-3xl">
        Building real relationships with suppliers unlocks better pricing,
        early access to inventory, and exclusive deals.
      </p>

      <div className="space-y-6 max-w-3xl">
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            1. Connect with a Sales Rep
          </h2>
          <p className="text-gray-300">
            Call or email the company directly and ask to speak with a rep. Once
            they know you’re serious, they’ll often offer early access or bulk
            pricing.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            2. Stay Consistent
          </h2>
          <p className="text-gray-300">
            Vendors prioritize buyers who order regularly. Even small monthly
            orders build trust and open doors for negotiation later.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            3. Follow Up and Build Relationships
          </h2>
          <p className="text-gray-300">
            Always thank your rep after a deal, ask what’s coming in next week,
            and follow up periodically. These personal touches go a long way.
          </p>
        </section>
      </div>
    </main>
  );
}
