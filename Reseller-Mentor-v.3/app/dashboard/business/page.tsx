"use client";

export default function BusinessSetupPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold text-[#E4B343] mb-4">
        Business Setup for Resellers
      </h1>
      <p className="text-gray-400 mb-8 max-w-3xl">
        Setting up your business correctly is the foundation for long-term success as a reseller.
        Here’s a guide to help you get structured and organized from day one.
      </p>

      <div className="space-y-6 max-w-3xl">

        {/* 1. Choose a Business Structure */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            1. Choose a Business Structure
          </h2>
          <p className="text-gray-300">
            Decide on your legal structure — most resellers start as an LLC to separate personal
            and business finances. This gives you protection and flexibility as you grow.
          </p>
        </section>

        {/* 2. Get a Reseller Certificate or Tax Exempt License */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            2. Get a Reseller Certificate or Tax Exempt License
          </h2>
          <p className="text-gray-300">
            Most suppliers will require your resale certificate or tax-exempt license before
            selling to you at wholesale. You can usually apply through your state’s Department
            of Revenue website. This also allows you to purchase inventory tax-free.
          </p>
        </section>

        {/* 3. Open Business Bank Accounts */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            3. Open Business Bank Accounts & Credit Cards
          </h2>
          <p className="text-gray-300">
            Separate your personal and business finances. Open a dedicated business checking
            account and credit card for purchases, expenses, and deposits. This keeps your
            accounting clean and simplifies tax prep.
          </p>
        </section>

        {/* 4. Track Everything */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            4. Track Everything
          </h2>
          <p className="text-gray-300">
            Keep detailed records of income, expenses, inventory, and mileage. 
            We recommend getting an annual subscription to <strong>QuickBooks</strong> — the app links to 
            all your accounts so purchases are automatically tracked, and it even logs mileage 
            for tax deductions.
          </p>
          <p className="text-gray-400 mt-2">
            Investing in your business to save time, track finances, and stay organized will
            pay off long term. Moving from manual tracking to digital automation helps prevent
            mistakes and makes tax season painless.
          </p>
        </section>

      </div>

      {/* Legal Disclaimer */}
      <div className="border-t border-[#E4B343]/30 mt-12 pt-6 max-w-3xl">
        <p className="text-gray-500 text-sm">
          ⚖️ <strong>Disclaimer:</strong> The information provided here is for educational
          purposes only and does not constitute legal or tax advice. Always consult a licensed
          professional regarding your specific situation.
        </p>
      </div>
    </main>
  );
}

