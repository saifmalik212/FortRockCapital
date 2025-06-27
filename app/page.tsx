"use client";

import { useAuth } from '@/contexts/AuthContext';
import { PricingSection } from '@/components/PricingSection';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import { VideoModal } from '@/components/VideoModal';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, Shield, TrendingUp, Users, Lock, CreditCard, Moon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link as ScrollLink } from 'react-scroll';
import { FaReddit } from 'react-icons/fa';
import { 
  FaGithub, 
  FaDiscord, 
  FaProductHunt,
  FaXTwitter,
  FaHackerNews,
  FaInstagram,
  FaTiktok,
  FaYoutube
} from 'react-icons/fa6';

/* eslint-disable @typescript-eslint/no-unused-vars */

// Performance comparison data
const performanceData = [
  { year: "2019", sp500: 28.9, fortrock: 32.4 },
  { year: "2020", sp500: 16.3, fortrock: 15.3 },
  { year: "2021", sp500: 26.9, fortrock: 22.1 },
  { year: "2022", sp500: -19.4, fortrock: 8.7 },
  { year: "2023", sp500: 24.2, fortrock: 18.4 },
  { year: "2024", sp500: 23.3, fortrock: 26.8 },
]

// Typewriter effect hook
function useTypewriter(texts: string[], speed = 100, deleteSpeed = 50, pauseTime = 2000) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[currentIndex]

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing
          if (displayText.length < currentText.length) {
            setDisplayText(currentText.slice(0, displayText.length + 1))
          } else {
            // Finished typing, start deleting after pause
            setTimeout(() => setIsDeleting(true), pauseTime)
          }
        } else {
          // Deleting
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1))
          } else {
            // Finished deleting, move to next text
            setIsDeleting(false)
            setCurrentIndex((prev) => (prev + 1) % texts.length)
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    )

    return () => clearTimeout(timeout)
  }, [displayText, currentIndex, isDeleting, texts, speed, deleteSpeed, pauseTime])

  return displayText
}

// Update workflowSteps to be more generic
const workflowSteps = [
  {
    title: "Step One",
    description: "First step of your workflow",
    preview: <TypewriterEffect text="Processing step one..." />
  },
  {
    title: "Step Two",
    description: "Second step of your workflow",
    preview: <TypewriterEffect text="Executing step two..." />
  },
  {
    title: "Step Three",
    description: "Third step of your workflow",
    preview: <TypewriterEffect text="Running step three..." />
  },
  {
    title: "Step Four",
    description: "Fourth step of your workflow",
    preview: <TypewriterEffect text="Completing step four..." />
  }
];

// Update platforms to be generic
const platforms = [
  { name: 'Platform 1', icon: FaGithub },
  { name: 'Platform 2', icon: FaDiscord },
  { name: 'Platform 3', icon: FaReddit },
  { name: 'Platform 4', icon: FaProductHunt },
  { name: 'Platform 5', icon: FaXTwitter },
  { name: 'Platform 6', icon: FaHackerNews },
  { name: 'Platform 7', icon: FaInstagram },
  { name: 'Platform 8', icon: FaTiktok },
  { name: 'Platform 9', icon: FaYoutube }
];

// Update workflowSections to be generic
const workflowSections = [
  {
    id: "overview",
    title: "Overview",
    description: "Everything you need to build modern SaaS applications",
    bgColor: "bg-white dark:bg-[#0B1120]"
  },
  {
    id: "authentication",
    title: "Authentication",
    description: "Secure user authentication with multiple providers",
    bgColor: "bg-slate-50 dark:bg-[#0B1120]",
    metrics: [
      { label: "Auth Providers", value: "5+" },
      { label: "Setup Time", value: "2min" },
      { label: "Security", value: "A+" }
    ]
  },
  {
    id: "payments",
    title: "Payments",
    description: "Seamless payment integration with Stripe",
    bgColor: "bg-white dark:bg-[#0B1120]",
    metrics: [
      { label: "Integration", value: "1-Click" },
      { label: "Providers", value: "Stripe" },
      { label: "Setup Time", value: "5min" }
    ]
  },
  {
    id: "database",
    title: "Database",
    description: "Powerful database with Supabase integration",
    bgColor: "bg-slate-50 dark:bg-[#0B1120]",
    metrics: [
      { label: "Database", value: "PostgreSQL" },
      { label: "Real-time", value: "Yes" },
      { label: "Security", value: "RLS" }
    ]
  },
  {
    id: "features",
    title: "Features",
    description: "Additional features to enhance your application",
    bgColor: "bg-white dark:bg-[#0B1120]",
    metrics: [
      { label: "Dark Mode", value: "Built-in" },
      { label: "Components", value: "50+" },
      { label: "TypeScript", value: "100%" }
    ]
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Simple, transparent pricing for your needs",
    bgColor: "bg-slate-50 dark:bg-[#0B1120]"
  }
];

// Custom Hook to create section progress values
function useSectionProgressValues(numSections: number) {
  const { scrollYProgress } = useScroll();
  
  // Create all transforms at once, at the top level
  const section1Progress = useTransform(
    scrollYProgress,
    [0 / numSections, 1 / numSections],
    [0, 1]
  );
  const section2Progress = useTransform(
    scrollYProgress,
    [1 / numSections, 2 / numSections],
    [0, 1]
  );
  const section3Progress = useTransform(
    scrollYProgress,
    [2 / numSections, 3 / numSections],
    [0, 1]
  );
  const section4Progress = useTransform(
    scrollYProgress,
    [3 / numSections, 4 / numSections],
    [0, 1]
  );

  return [section1Progress, section2Progress, section3Progress, section4Progress];
}

// Feature cards data
const featureCards = [
  {
    title: "Authentication",
    description: "Supabase auth with social providers",
    icon: <Lock className="h-6 w-6 text-primary" />,
    bgGradient: "from-blue-500/10 to-purple-500/10"
  },
  {
    title: "Payments",
    description: "Stripe subscription management",
    icon: <CreditCard className="h-6 w-6 text-primary" />,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  },
  {
    title: "Dark Mode",
    description: "Built-in theme management",
    icon: <Moon className="h-6 w-6 text-primary" />,
    bgGradient: "from-orange-500/10 to-red-500/10"
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const { isInTrial } = useTrialStatus();
  const [activeSection, setActiveSection] = useState("overview");
  const sectionProgressValues = useSectionProgressValues(workflowSections.length);
  const [isScrolled, setIsScrolled] = useState(false)
  
  const router = useRouter();

  const [dashboardRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const { scrollYProgress } = useScroll();

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const typewriterTexts = [
    "Advanced AI algorithms driving superior investment returns",
    "Machine learning models analyzing global market patterns", 
    "Automated portfolio optimization for institutional clients",
    "Real-time risk assessment powered by artificial intelligence",
    "Quantitative strategies enhanced by deep learning technology",
  ]

  const typewriterText = useTypewriter(typewriterTexts, 80, 40, 1500)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 30)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Hero Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-background.png')",
          height: "100vh",
          zIndex: 1,
        }}
      >
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Professional Finance Background - Lower sections */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ top: "100vh", zIndex: 0 }}>
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="finance-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#finance-grid)" className="text-gray-900" />
          </svg>
        </div>

        {/* Subtle Financial Chart Lines */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Market trend lines */}
            <path
              d="M 0 300 Q 200 250 400 280 T 800 260 T 1200 240"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-gray-800"
            />
            <path
              d="M 0 350 Q 250 320 500 340 T 1000 320 T 1400 300"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-gray-700"
            />
            <path
              d="M 0 400 Q 300 370 600 390 T 1200 370"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-gray-600"
            />
          </svg>
        </div>

        {/* Subtle Data Points */}
        <div className="absolute top-32 right-20 text-xs text-gray-900/[0.04] font-mono">AAPL 150.25 +2.3%</div>
        <div className="absolute top-48 left-16 text-xs text-gray-900/[0.04] font-mono">SPY 485.67 +0.8%</div>
        <div className="absolute bottom-40 right-32 text-xs text-gray-900/[0.04] font-mono">QQQ 392.14 +1.2%</div>
        <div className="absolute bottom-56 left-24 text-xs text-gray-900/[0.04] font-mono">VTI 267.89 +0.6%</div>

        {/* Very Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/[0.01] via-transparent to-gray-100/[0.01]"></div>
      </div>

      {/* Dynamic Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? "bg-black/95 backdrop-blur-md shadow-2xl mx-8 mt-2 rounded-2xl"
            : "bg-black/10 backdrop-blur-sm mx-0"
        }`}
      >
        <div
          className={`mx-auto px-6 flex items-center justify-between transition-all duration-500 ease-out ${
            isScrolled ? "py-3 w-full" : "py-3 container"
          }`}
        >
          <div className="flex items-center">
            <span
              className={`text-lg font-bold transition-all duration-500 px-3 py-1 ${
                isScrolled ? "text-white bg-transparent rounded-2xl" : "text-white bg-black/80 backdrop-blur-sm"
              }`}
            >
              FortRock Capital
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="#performance"
              className={`transition-all duration-500 hover:opacity-80 text-sm font-medium ${
                isScrolled ? "text-gray-300 hover:text-white" : "text-white hover:text-gray-200"
              } font-mono`}
            >
              Performance
            </Link>
            <Link
              href="#services"
              className={`transition-all duration-500 hover:opacity-80 text-sm font-medium ${
                isScrolled ? "text-gray-300 hover:text-white" : "text-white hover:text-gray-200"
              } font-mono`}
            >
              Services
            </Link>
            <Link
              href="#pricing"
              className={`transition-all duration-500 hover:opacity-80 text-sm font-medium ${
                isScrolled ? "text-gray-300 hover:text-white" : "text-white hover:text-gray-200"
              } font-mono`}
            >
              Pricing
            </Link>
            {user ? (
              <>
                <Link href="/dcf">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`transition-all duration-500 text-sm ml-4 ${
                      isScrolled
                        ? "bg-transparent text-white border-white hover:bg-white hover:text-black"
                        : "bg-white/20 text-white border-white/50 hover:bg-white hover:text-black backdrop-blur-sm"
                    } font-mono`}
                  >
                    Client Portal
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className={`transition-all duration-500 text-sm ${
                      isScrolled
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-white/90 text-black hover:bg-white backdrop-blur-sm"
                    } font-mono`}
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`transition-all duration-500 text-sm ml-4 ${
                      isScrolled
                        ? "bg-transparent text-white border-white hover:bg-white hover:text-black"
                        : "bg-white/20 text-white border-white/50 hover:bg-white hover:text-black backdrop-blur-sm"
                    } font-mono`}
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className={`transition-all duration-500 text-sm ${
                      isScrolled
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-white/90 text-black hover:bg-white backdrop-blur-sm"
                    } font-mono`}
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-16 relative z-10">
        {/* Hero Section with Background Image */}
        <section className="py-24 relative min-h-screen flex items-end justify-end" style={{ zIndex: 2 }}>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl ml-auto text-right mb-8 mr-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl font-mono">
                Full Stack AI
                <br />
                <span className="text-gray-200 font-mono">Investment Firm</span>
              </h1>
              <div className="text-xl text-green-400 mb-8 drop-shadow-lg min-h-[3rem] flex items-center justify-end font-mono">
                <span className="font-mono">
                  {typewriterText}
                  <span className="animate-pulse text-green-400">|</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                {user ? (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="bg-white/90 text-black hover:bg-white px-8 py-3 backdrop-blur-sm shadow-2xl font-mono"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => router.push('/signup')}
                    className="bg-white/90 text-black hover:bg-white px-8 py-3 backdrop-blur-sm shadow-2xl font-mono"
                  >
                    Start Investing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="bg-white/10 text-white border-white/50 hover:bg-white/20 px-8 py-3 backdrop-blur-sm shadow-2xl font-mono"
                >
                  View Performance
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Overlapping with background */}
        <section className="py-16 bg-white/95 backdrop-blur-sm relative" style={{ zIndex: 3, marginTop: "-10vh" }}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-black mb-2 font-mono">$2.4B</div>
                <div className="text-gray-600 font-mono">Assets Under Management</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-black mb-2 font-mono">15+</div>
                <div className="text-gray-600 font-mono">Years Experience</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-black mb-2 font-mono">12.8%</div>
                <div className="text-gray-600 font-mono">Average Annual Return</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-black mb-2 font-mono">200+</div>
                <div className="text-gray-600 font-mono">Institutional Clients</div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Comparison Chart */}
        <section id="performance" className="py-16 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4 font-mono">Performance vs S&P 500</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto font-mono">
                Our AI-driven strategies consistently outperform traditional benchmarks through advanced machine
                learning
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <Card className="border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-black text-center font-mono">Annual Returns Comparison (%)</CardTitle>
                  <CardDescription className="text-gray-600 text-center font-mono">
                    FortRock Capital AI vs S&P 500 Index
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip
                          formatter={(value, name) => [`${value}%`, name === "sp500" ? "S&P 500" : "FortRock AI"]}
                        />
                        <Legend formatter={(value) => (value === "sp500" ? "S&P 500" : "FortRock AI")} />
                        <Line type="monotone" dataKey="sp500" stroke="#6b7280" strokeWidth={2} name="S&P 500" />
                        <Line type="monotone" dataKey="fortrock" stroke="#000000" strokeWidth={3} name="FortRock AI" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 bg-gray-50 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-black mb-4 font-mono">AI-Powered Investment Solutions</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto font-mono">
                Cutting-edge artificial intelligence and machine learning technologies driving superior investment
                outcomes
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <TrendingUp className="h-12 w-12 text-black mb-4" />
                  <CardTitle className="text-black font-mono">AI Equity Strategies</CardTitle>
                  <CardDescription className="text-gray-600 font-mono">
                    Machine learning algorithms for pattern recognition and predictive modeling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-600 space-y-2 font-mono">
                    <li>• Deep learning analysis</li>
                    <li>• Neural network models</li>
                    <li>• Automated risk assessment</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 text-black mb-4" />
                  <CardTitle className="text-black font-mono">Quantitative AI</CardTitle>
                  <CardDescription className="text-gray-600 font-mono">
                    Advanced algorithms processing vast datasets for optimal portfolio construction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-600 space-y-2 font-mono">
                    <li>• Real-time data processing</li>
                    <li>• Predictive analytics</li>
                    <li>• Automated rebalancing</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Shield className="h-12 w-12 text-black mb-4" />
                  <CardTitle className="text-black font-mono">AI Risk Management</CardTitle>
                  <CardDescription className="text-gray-600 font-mono">
                    Intelligent risk monitoring and mitigation powered by artificial intelligence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-600 space-y-2 font-mono">
                    <li>• Dynamic risk modeling</li>
                    <li>• Anomaly detection</li>
                    <li>• Adaptive hedging</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-black mb-4 font-mono">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto font-mono">
                Choose the plan that fits your investment needs
              </p>
            </div>
            <PricingSection />
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="relative py-20 bg-gray-50"
        >
          <div className="container mx-auto px-4">
            <div className="relative bg-white rounded-xl shadow-xl p-12 border border-gray-200">
              <div className="text-center">
                <motion.h2 
                  initial={{ y: 20 }}
                  whileInView={{ y: 0 }}
                  className="text-3xl font-bold text-black font-mono"
                >
                  Ready to Get Started?
                </motion.h2>
                <p className="mt-4 text-lg text-gray-600 font-mono">
                  Start using our AI-powered investment platform today
                </p>
                
                <div className="mt-10 flex gap-4 justify-center">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setIsVideoModalOpen(true)}
                      className="px-8 py-3 bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all font-mono"
                      size="lg"
                    >
                      Watch Demo
                    </Button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={() => router.push(user ? '/dashboard' : '/signup')}
                      variant="outline"
                      className="px-8 py-3 bg-white hover:bg-gray-50 text-black border-2 border-black shadow-lg hover:shadow-xl transition-all font-mono"
                      size="lg"
                    >
                      {user ? 'Go to Dashboard' : 'Start Free Trial'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="S1cnQG0-LP4"
      />
    </div>
  );
}

