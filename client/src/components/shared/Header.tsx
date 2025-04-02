import { useState } from "react";
import { Link } from "react-router-dom";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileOpen((prev) => !prev);
  };

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

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
      <div className="mx-auto max-w-7xl px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FaMoneyCheckAlt size={24} style={{ color: "#16a34a" }} />
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <span className="text-lg text-green-600 font-semibold">
                  PAYROLL
                </span>
                <span className="block text-xs text-gray-600">
                  Management System
                </span>
              </Box>
              <span className="sm:hidden text-lg font-semibold">PMS</span>
            </Box>
          </Link>
        </Box>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3 }}>
          <Link
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features");
            }}
            to="#features"
            className="text-gray-600 hover:text-green-600 font-medium"
          >
            Features
          </Link>
          <Link
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("benefits");
            }}
            to="#benefits"
            className="text-gray-600 hover:text-green-600 font-medium"
          >
            Benefits
          </Link>
          <Link
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("pricing");
            }}
            to="#pricing"
            className="text-gray-600 hover:text-green-600 font-medium"
          >
            Pricing
          </Link>
        </Box>

        {/* CTA Buttons - Desktop */}
        <Box
          sx={{
            display: { xs: "none", sm: "block" },
            alignItems: "center",
          }}
        >
          <Link
            to="/auth/signin"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 !text-white hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
          >
            Sign In
          </Link>
        </Box>

        {/* Mobile Menu Button */}
        <IconButton sx={{ display: { md: "none" } }} onClick={toggleMobileMenu}>
          <MenuIcon />
        </IconButton>
      </div>

      {/* Mobile Drawer Menu */}
      <Drawer anchor="right" open={mobileOpen} onClose={toggleMobileMenu}>
        <Box sx={{ width: 250, p: 2 }}>
          <IconButton onClick={toggleMobileMenu} sx={{ mb: 2 }}>
            <CloseIcon />
          </IconButton>

          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="#features">
                Features
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="#benefits">
                Benefits
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="#pricing">
                Pricing
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/auth/signin">
                Sign In
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <Link
                to="/auth/signup"
                className="mt-2 block text-center px-4 py-2 rounded-lg bg-green-600 !text-white hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
                onClick={toggleMobileMenu}
              >
                Get Started
              </Link>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </header>
  );
}