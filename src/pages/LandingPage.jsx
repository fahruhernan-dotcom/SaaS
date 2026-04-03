import React, { useState } from 'react';
import Navbar from '../components/Navbar';
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
import Footer from '../components/Footer';

import ComparisonTable from '../sections/ComparisonTable';
import StickyCTA from '../components/StickyCTA';

const LandingPage = () => {
  const [activeRole, setActiveRole] = useState('peternak');

  return (
    <div className="bg-bg-base min-h-screen text-text-primary font-body overflow-x-hidden">
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
      <FinalCTA />
      <Footer />
      <StickyCTA />
    </div>
  );
};

export default LandingPage;
