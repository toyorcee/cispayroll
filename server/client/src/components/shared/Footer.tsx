import { Link } from "react-router-dom";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { FaTwitter, FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { Container } from "./Container";

export function Footer() {
  const year = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 64;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const quickLinks = [
    { name: "Features", id: "features" },
    { name: "Benefits", id: "benefits" },
    { name: "Pricing", id: "pricing" },
  ];

  return (
    <footer className="bg-white w-full border-t border-gray-200 mx-auto">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link
              to="/"
              className="flex justify-center md:justify-start items-center gap-2"
            >
              <FaMoneyCheckAlt className="h-6 w-6 text-green-600" />
              <span className="text-xl font-semibold text-gray-900">
                PAYROLL
              </span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-md mx-auto md:mx-0">
              Streamline your payroll processes with our efficient, accurate,
              and secure management system for businesses of all sizes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={`#${link.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.id);
                    }}
                    className="text-gray-600 hover:!text-green-600 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase">
              Connect With Us
            </h3>
            <div className="mt-4 flex justify-center md:justify-start space-x-4">
              {[FaTwitter, FaLinkedinIn, FaFacebookF].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="!text-green-600 hover:text-green-600 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-200 pt-4 text-center">
          <p className="text-green-600">© {year} PMS. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
