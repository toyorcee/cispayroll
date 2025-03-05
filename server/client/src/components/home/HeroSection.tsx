import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Container } from "../shared/Container";
import "../../styles/HeroSection.css";

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hero-section relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-gray-50/90" />

      {/* Content */}
      <Container className="relative z-10 text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6"
        >
          Modern Payroll
          <span className="text-green-600"> Management</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
        >
          Streamline your payroll process with our comprehensive solution
        </motion.p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.8,
            }}
          >
            <Link
              to="/auth/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-600 !text-white hover:bg-green-700 transition-colors font-medium text-lg"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.8,
            }}
          >
            <Link
              to="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-green-600 text-green-600 hover:bg-green-50 transition-colors font-medium text-lg"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </Container>
    </motion.section>
  );
}
