import { Outlet } from "react-router-dom";
import { Container } from "@mui/material";
import { Header } from "./Header";
import { Footer } from "./Footer";

export default function AppLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1 w-full pt-16">
        <Container maxWidth="xl" className="px-4 sm:px-6 lg:px-8">
          <Outlet />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
