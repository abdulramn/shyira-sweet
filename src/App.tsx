import { useEffect, useState } from "react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Menu from "./components/Menu";
import Gallery from "./components/Gallery";
import Kunafa from "./components/Kunafa";
import About from "./components/About";
import LocalSEO from "./components/LocalSEO";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Show dashboard if URL contains ?admin
    if (window.location.search.includes("admin")) {
      setIsAdmin(true);
    }
  }, []);

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main>
        <Hero />

        <Menu />

        <Gallery />

        <Kunafa />

        <About />

        {/* Local SEO content for Dearborn & Metro Detroit */}
        <LocalSEO />

        <Contact />
      </main>

      <Footer />
    </div>
  );
}
