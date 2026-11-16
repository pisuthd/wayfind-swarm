'use client';

import Navbar from './Navbar';
import Hero from './Hero';
import Showcase from './Showcase';
import Teams from './Teams';
import HowItWorks from './HowItWorks';
import Pricing from './Pricing';
import Faq from './Faq';
import Footer from './Footer';

interface LandingProps {
  onSignIn: () => void;
}

export default function Landing({ onSignIn }: LandingProps) {
  return (
    <main className="bg-white text-navy">
      <Navbar onSignIn={onSignIn} />
      <Hero onSignIn={onSignIn} />
      <Showcase />
      <Teams />
      <HowItWorks />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
