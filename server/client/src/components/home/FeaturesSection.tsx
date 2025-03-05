import { motion } from "framer-motion";
import { Container } from "../shared/Container";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: CalendarIcon,
    title: "Automated Timekeeping",
    description:
      "Accurate time tracking and attendance management with automated calculations.",
  },
  {
    icon: CurrencyDollarIcon,
    title: "Smart Payroll Processing",
    description:
      "Automated salary calculations, tax deductions, and payment processing.",
  },
  {
    icon: DocumentTextIcon,
    title: "Compliance Management",
    description:
      "Stay compliant with automated tax calculations and regulatory updates.",
  },
  {
    icon: ChartBarIcon,
    title: "Advanced Reporting",
    description:
      "Comprehensive reports and analytics for better decision making.",
  },
  {
    icon: UserGroupIcon,
    title: "Employee Self-Service",
    description:
      "Empower employees to access their payroll information and documents.",
  },
  {
    icon: CogIcon,
    title: "Integration Ready",
    description:
      "Seamlessly integrate with HR, accounting, and banking systems.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Payroll
          </h2>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Everything you need to manage your company's payroll efficiently and
            accurately
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <feature.icon className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
