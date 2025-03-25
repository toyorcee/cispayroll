import { motion, useInView } from "framer-motion";
import { Container } from "../shared/Container";
import { useRef, useEffect, useState } from "react";

const benefits = [
  {
    stat: "98%",
    title: "Accuracy Rate",
    description: "In payroll processing and tax calculations",
  },
  {
    stat: "75%",
    title: "Time Saved",
    description: "Reduction in payroll processing time",
  },
  {
    stat: "24/7",
    title: "Availability",
    description: "Access to payroll data and support",
  },
];

const testimonials = [
  {
    quote:
      "Implementing this payroll system has transformed how we manage our employee payments. It's intuitive and reliable.",
    author: "Tope Afolayan",
    role: "HR Director",
    company: "Tech Solutions Inc.",
  },
  {
    quote:
      "The automated calculations and compliance updates have saved us countless hours and eliminated errors.",
    author: "Chidubem Okafor",
    role: "Finance Manager",
    company: "Global Innovations",
  },
];

// Counter component for animating numbers
function AnimatedCounter({
  value,
  duration = 2,
}: {
  value: string;
  duration: number;
}) {
  const [counter, setCounter] = useState(0);
  const elementRef = useRef(null);
  const isInView = useInView(elementRef, { once: true });

  // Special case for "24/7"
  if (value === "24/7") {
    useEffect(() => {
      if (isInView) {
        let startTime: number;
        const animateCount = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = (timestamp - startTime) / (duration * 1000);

          if (progress < 1) {
            setCounter(Math.min(Math.floor(24 * progress), 24));
            requestAnimationFrame(animateCount);
          } else {
            setCounter(24);
          }
        };
        requestAnimationFrame(animateCount);
      }
    }, [isInView, duration]);

    return (
      <span
        ref={elementRef}
        className="text-4xl sm:text-5xl font-bold text-green-600"
      >
        {counter}/7
      </span>
    );
  }

  // For percentage values
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""));
  const suffix = value.replace(/[0-9]/g, "");

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (duration * 1000);

        if (progress < 1) {
          setCounter(
            Math.min(Math.floor(numericValue * progress), numericValue)
          );
          requestAnimationFrame(animateCount);
        } else {
          setCounter(numericValue);
        }
      };
      requestAnimationFrame(animateCount);
    }
  }, [isInView, numericValue, duration]);

  return (
    <span
      ref={elementRef}
      className="text-4xl sm:text-5xl font-bold text-green-600"
    >
      {counter}
      {suffix}
    </span>
  );
}

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 bg-white">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, rotateY: 180 }}
              whileInView={{ opacity: 1, rotateY: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.7,
                delay: index * 0.3,
                type: "spring",
                damping: 12,
              }}
              className="text-center"
            >
              <div className="mb-2">
                <AnimatedCounter
                  value={benefit.stat}
                  duration={2 + index * 0.5} // Stagger the counting duration
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 md:p-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12"
          >
            What Our Clients Say
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <p className="text-gray-600 italic mb-4">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-green-600">
                    {testimonial.company}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
