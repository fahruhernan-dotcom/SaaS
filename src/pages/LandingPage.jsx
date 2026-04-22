import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Hero from '../sections/Hero';
import StatsBar from '../sections/StatsBar';
import PainPoints from '../sections/PainPoints';
import Features from '../sections/Features';
import HowItWorks from '../sections/HowItWorks';
import MarketPrice from '../sections/MarketPrice';
import Pricing from '../sections/Pricing';
import TestimonialsNew from '../sections/TestimonialsNew';
import BeforeAfter from '../sections/BeforeAfter';
import FinalCTA from '../sections/FinalCTA';
import PeopleAlsoAsk from '../sections/PeopleAlsoAsk';
import Footer from '../components/Footer';

import ComparisonTable from '../sections/ComparisonTable';
import StickyCTA from '../components/StickyCTA';

const LandingPage = () => {
  const [activeRole, setActiveRole] = useState('peternak');

  const hubSchema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://ternakos.my.id/#website",
      "url": "https://ternakos.my.id",
      "name": "TernakOS",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://ternakos.my.id/faq?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://ternakos.my.id/#organization",
      "name": "TernakOS",
      "url": "https://ternakos.my.id",
      "logo": "https://ternakos.my.id/logo.png",
      "description": "Platform SaaS Manajemen Ternak #1 di Indonesia",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+6281358925505",
        "contactType": "customer service",
        "areaServed": "ID",
        "availableLanguage": "Indonesian"
      },
      "sameAs": [
        "https://instagram.com/ternakos.id",
        "https://linkedin.com/company/ternakos"
      ]
    }
  ];

  return (
    <div className="bg-bg-base min-h-screen text-text-primary font-body overflow-x-hidden">
      <SEO
        title="TernakOS - Platform SaaS Manajemen Ternak #1 Indonesia"
        description="Kelola kandang, harga pasar, dan laporan keuangan peternakan Anda dalam satu platform digital. Untuk peternak, broker, dan RPA. Paket Starter GRATIS selamanya, tanpa kartu kredit."
        path="/"
        schema={hubSchema}
      />
      <Navbar />
      <Hero />
      <StatsBar />
      <PainPoints activeRole={activeRole} setActiveRole={setActiveRole} />
      <BeforeAfter activeRole={activeRole} />
      <ComparisonTable />
      <Features activeRole={activeRole} />
      <HowItWorks activeRole={activeRole} />
      <MarketPrice activeRole={activeRole} />
      <Pricing activeRole={activeRole} setActiveRole={setActiveRole} />
      <TestimonialsNew />
      <PeopleAlsoAsk />
      <FinalCTA />
      <Footer />
      <StickyCTA />
    </div>
  );
};

export default LandingPage;
