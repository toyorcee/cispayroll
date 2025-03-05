import { motion } from "framer-motion";
import { Container } from "../shared/Container";

const plans = [
  {
    name: "Basic",
    description: "For small businesses getting started",
    price: "Starting at ₦30,000/month",
    features: [
      "Up to 20 employees",
      "Monthly payroll processing",
      "Basic tax calculations",
      "Employee self-service portal",
      "Email support",
    ],
  },
  {
    name: "Professional",
    description: "For growing companies",
    price: "Starting at ₦75,000/month",
    features: [
      "Up to 100 employees",
      "Bi-weekly/Monthly payroll",
      "Tax filing & remittance",
      "Benefits management",
      "Priority support",
      "Detailed reporting",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom pricing",
    features: [
      "Unlimited employees",
      "Custom payroll frequency",
      "Multi-state tax filing",
      "Full HR integration",
      "Dedicated account manager",
      "API access",
      "Custom reports",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Plans That Scale With Your Business
          </h2>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Choose the right payroll solution for your organization's size and
            needs
          </p>
        </motion.div>

        <div className="overflow-hidden px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[95%] mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 1.2,
                  delay: index * 0.4,
                  type: "spring",
                  bounce: 0.2,
                  stiffness: 50,
                }}
                className="bg-white rounded-xl p-6 ring-2 ring-green-600 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <p className="text-3xl font-bold text-green-600">
                    {plan.price}
                  </p>
                </div>
                <div className="flex-grow">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-3">
                        <svg
                          className="h-5 w-5 text-green-500 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
