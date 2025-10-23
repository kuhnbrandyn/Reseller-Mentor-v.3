"use client";

export default function ShippingSetupPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold text-[#E4B343] mb-4">
        Setting Up Shipping to Receive Pallets
      </h1>
      <p className="text-gray-400 mb-8 max-w-3xl">
        When buying liquidation or wholesale pallets, proper shipping setup makes all the difference. 
        Make sure to factor shipping into your <strong>price per piece</strong> before finalizing any deal — it can quickly change your profit margins.
      </p>

      <div className="space-y-6 max-w-3xl">
        {/* 1. Freight Brokers */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            1. Freight Brokers Simplify Everything
          </h2>
          <p className="text-gray-300">
            Freight brokers coordinate directly with carriers to find you the best rates. 
            They handle pickup scheduling, tracking, and delivery — saving you time and money. 
            You don’t need a logistics team; a good broker manages it all.
          </p>
        </section>

        {/* 2. Get Accurate Quotes */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            2. Get Accurate Shipping Quotes
          </h2>
          <p className="text-gray-300">
            Always provide your broker with:
          </p>
          <ul className="list-disc list-inside text-gray-300 ml-4 mt-2">
            <li>Pickup zip code</li>
            <li>Delivery zip code</li>
            <li>Total weight or number of pallets</li>
            <li>Whether it’s a residential delivery or has a liftgate</li>
          </ul>
          <p className="text-gray-400 mt-2">
            These details ensure accurate pricing and help avoid delivery delays or surprise fees.
          </p>
        </section>

        {/* 3. Preparing to Receive Pallets */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            3. Prepare Your Location
          </h2>
          <p className="text-gray-300">
            Make sure your delivery area is clear and accessible for a large truck or liftgate service. 
            If you’re receiving at home or a small warehouse, check if the driver will need help unloading 
            or if a pallet jack will be required.
          </p>
        </section>

        {/* 4. Inspect Upon Delivery */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            4. Inspect Pallets Upon Delivery
          </h2>
          <p className="text-gray-300">
            Before signing, inspect the pallets carefully. 
            Look for broken wrap, missing labels, or obvious damage. 
            Take photos immediately — once you sign the Bill of Lading, the shipment is considered accepted.
          </p>
        </section>

        {/* 5. Recommended Broker */}
        <section>
          <h2 className="text-2xl font-semibold text-[#E4B343] mb-2">
            5. Recommended Freight Broker
          </h2>
          <p className="text-gray-300">
            While any reputable freight broker will work, we personally use and recommend:
          </p>
          <p className="text-[#E4B343] font-semibold mt-2">
            Williams Systems
          </p>
          <p className="text-gray-400 mt-1">
            They’ve consistently provided reliable service, fair pricing, and timely communication 
            for all of our inbound pallet shipments.
          </p>
        </section>
      </div>

      {/* Motivational Footer */}
      <div className="border-t border-[#E4B343]/30 mt-12 pt-6 max-w-3xl">
        <p className="text-[#E4B343] text-lg font-semibold italic">
          Freight isn’t a barrier — it’s the bridge to scaling your business.
        </p>
      </div>
    </main>
  );
}
