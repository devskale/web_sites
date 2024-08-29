import React, { ReactNode, ButtonHTMLAttributes } from 'react'

// Custom Button component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => (
  <button
    className={`px-4 py-2 rounded font-semibold text-white transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
)

// Custom Card component
interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`} {...props}>
    {children}
  </div>
)

export default function Component() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white py-6 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg
              className="h-10 w-10 text-yellow-400"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 21h18" />
              <path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
              <path d="M3 7h18" />
              <path d="M3 7v14h18V7" />
              <path d="M5 21v-2" />
              <path d="M19 21v-2" />
              <path d="M9 13h.01" />
              <path d="M15 13h.01" />
            </svg>
            <span className="text-2xl font-bold">Ukraine Reconstruction Bank</span>
          </div>
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <a href="#about" className="hover:text-yellow-400 transition-colors duration-200">
                  About
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-yellow-400 transition-colors duration-200">
                  Services
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-yellow-400 transition-colors duration-200">
                  Contact
                </a>
              </li>
            </ul>
          </nav>
          <Button className="md:hidden bg-blue-600 hover:bg-blue-700">
            Menu
          </Button>
        </div>
      </header>
      <main className="flex-grow">
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
              Rebuilding Ukraine Together
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              The Ukraine Reconstruction Bank is committed to supporting the reconstruction and sustainable development
              of Ukraine, fostering economic growth and resilience.
            </p>
            <Button className="bg-yellow-400 text-blue-800 hover:bg-yellow-500 text-lg px-8 py-3 rounded-full transition-all duration-200 transform hover:scale-105 animate-fade-in-up animation-delay-400">
              Learn More
            </Button>
          </div>
        </section>
        <section id="about" className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-blue-800">
              About The Ukraine Reconstruction Bank (URB)
            </h2>
            <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-700">
              <p>
                The Ukraine Reconstruction Bank (URB) is a dedicated financial institution established to spearhead the
                reconstruction and development efforts in Ukraine. Our mission is to provide robust financial resources,
                expert guidance, and unwavering support for rebuilding critical infrastructure, revitalizing the
                economy, and fostering sustainable growth across the nation.
              </p>
              <p>
                Working in close collaboration with international partners, government agencies, and private sector
                entities, URB aims to channel investments strategically and efficiently to areas most in need of
                reconstruction and development. We are committed to transparency, accountability, and the highest
                standards of financial management to ensure that every investment contributes meaningfully to Ukraine's
                recovery and future prosperity.
              </p>
            </div>
          </div>
        </section>
        <section id="services" className="bg-gray-100 py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-blue-800">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
                <svg
                  className="h-12 w-12 text-blue-600 mb-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 22h-2" />
                  <path d="M20 15v7" />
                  <path d="M4 22h16" />
                  <path d="M15 22v-4a3 3 0 0 0-3-3v0a3 3 0 0 0-3 3v4" />
                  <path d="M4 15v7" />
                  <path d="M6 22H4" />
                  <path d="M2 14h20" />
                  <path d="M2 14v1a5 5 0 0 0 5 5" />
                  <path d="M22 14v1a5 5 0 0 1-5 5" />
                  <path d="M4 3h16l-4 8H8Z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2 text-blue-800">Infrastructure Financing</h3>
                <p className="text-gray-600">
                  Supporting the rebuilding of critical infrastructure across Ukraine, including transportation
                  networks, energy systems, and public facilities.
                </p>
              </Card>
              <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
                <svg
                  className="h-12 w-12 text-blue-600 mb-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <h3 className="text-xl font-semibold mb-2 text-blue-800">SME Support</h3>
                <p className="text-gray-600">
                  Providing loans and financial assistance to small and medium-sized enterprises, fostering economic
                  recovery and job creation.
                </p>
              </Card>
              <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
                <svg
                  className="h-12 w-12 text-blue-600 mb-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
                  <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
                </svg>
                <h3 className="text-xl font-semibold mb-2 text-blue-800">Project Consultation</h3>
                <p className="text-gray-600">
                  Offering expert advice on reconstruction projects, financial planning, and sustainable development
                  strategies.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer id="contact" className="bg-blue-800 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
          <div className="space-y-2 mb-8">
            <p className="text-lg">Email: info@ukrainereconstructionbank.org</p>
            <p className="text-lg">Phone: +380 44 123 4567</p>
            <p className="text-lg">Address: 1 Hrushevsky Street, Kyiv, Ukraine 01008</p>
          </div>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-white hover:text-yellow-400 transition-colors duration-200">
              <svg
                className="h-6 w-6"
                fill="currentColor"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" className="text-white hover:text-yellow-400 transition-colors duration-200">
              <svg
                className="h-6 w-6"
                fill="currentColor"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
            <a href="#" className="text-white hover:text-yellow-400 transition-colors duration-200">
              <svg
                className="h-6 w-6"
                fill="currentColor"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}