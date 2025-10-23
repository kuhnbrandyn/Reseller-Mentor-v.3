"use client";

export default function AvoidScamsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold text-[#E4B343] mb-4">
        How to Avoid Scams
      </h1>
      <p className="text-gray-400 mb-8 max-w-3xl">
        We get asked all the time how to avoid scams when sourcing pallets and
        wholesale inventory. Here’s how to protect yourself and buy confidently.
      </p>

      <div className="space-y-6 max-w-3xl">
        {/* 1 */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            1. Verify Every Supplier
          </h2>
          <p className="text-gray-300">
            Make sure the company has a working phone number, active website, and consistent
            business identity. Avoid anyone who only operates via Facebook DMs or CashApp.
          </p>
          <p className="text-gray-400 mt-2">
            ✅ Ask to communicate on the phone.<br />
            ✅ Ask for an address you can look up.<br />
            ✅ Request an EIN or LLC you can validate online.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            2. Ask for References or Manifests
          </h2>
          <p className="text-gray-300">
            A trustworthy liquidation supplier will provide manifests, sample invoices, or
            buyer references. Transparency is a major green flag.
          </p>
          <p className="text-gray-400 mt-2">
            🏷️ If it’s unmanifested, buy in person so you can verify what you’re getting.<br />
            🏷️ Once trust is built, unmanifested deals can be worth the risk.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            3. Avoid Cash-Only Deals
          </h2>
          <p className="text-gray-300">
            Always pay through an invoice, PayPal Business, or credit card so you have buyer
            protection. If they refuse—walk away.
          </p>
          <p className="text-gray-400 mt-2">
            💵 Cash deals are fine when meeting in person, but never send money through
            unverified channels or messaging apps.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            4. Trust Your Gut
          </h2>
          <p className="text-gray-300">
            If something feels off—too good to be true, pushy sales tactics, or vague product
            details—it probably is. Real suppliers don’t rush you.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            5. Ask These Questions Every Time
          </h2>
          <p className="text-gray-300">
            Make sure to ask all of these questions to every new supplier. Scammers lose
            interest fast when they realize you’re not an easy target and will validate their
            business.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            6. Validate with a Small Test Order
          </h2>
          <p className="text-gray-300">
            Most vendors have an MOQ (Minimum Order Quantity). Explain to new vendors that you
            need to go outside the MOQ for your first order to validate their business, their
            process, shipping times, and product quality.
          </p>
          <p className="text-gray-400 mt-2">
            📦 Start small — order 50–100 pieces to test communication, fulfillment speed,
            and accuracy before committing to larger buys.
          </p>
        </section>
      </div>
    </main>
  );
}

