import { Outlet } from "react-router-dom";
import { Container } from "@mui/material";

export default function AppLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <main className="flex-1 w-full pt-16">
        <Container maxWidth="xl" className="px-4 sm:px-6 lg:px-8">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
