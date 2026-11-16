'use client';

import Navbar from './Navbar';
import Hero from './Hero';
import Teams from './Teams';
import HowItWorks from './HowItWorks';
import Footer from './Footer';

interface LandingProps {
  onSignIn: () => void;
}

export default function Landing({ onSignIn }: LandingProps) {
  return (
    <main className="bg-white text-navy">
      <Navbar onSignIn={onSignIn} />
      <Hero onSignIn={onSignIn} />
      <Teams onSignIn={onSignIn} />
      <HowItWorks />
      <Footer />
    </main>
  );
}
