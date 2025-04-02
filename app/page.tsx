import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, BarChart, Zap, ArrowRight, CheckCircle } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { appBar } from "@/constants/appBar"

export default async function LandingPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 section-padding">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#f5f5f5,transparent)]"
          aria-hidden="true"
        ></div>
        <div className="container mx-auto container-padding relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl md:text-6xl/none">
                Empower Your <span className="gradient-text">Customer Sales</span> Strategy
              </h1>
              <p className="text-lg text-gray-600 max-w-[600px]">
                Let your customers choose the best products for their needs with our AI-powered sales assistant. Connect
                with customers like never before.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6 text-base">
                  <Link
                    href={{
                      pathname: "/auth",
                      query: { authType: "signUp" },
                    }}
                  >
                    Get Started
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-gray-100 rounded-full px-8 py-6 text-base"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] bg-gray-100 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-400 text-lg">Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-10">
        <div className="container mx-auto container-padding">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <p className="text-sm font-medium text-gray-500">TRUSTED BY INNOVATIVE COMPANIES</p>
            {["Company 1", "Company 2", "Company 3", "Company 4"].map((company, i) => (
              <div key={i} className="text-gray-400 font-semibold">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl mb-4">
              Powerful Features for Modern Sales Teams
            </h2>
            <p className="text-lg text-gray-600 max-w-[700px] mx-auto">
              Our platform combines cutting-edge AI with intuitive design to transform your customer interactions.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <Users className="h-10 w-10 text-black mb-4" />
              <h3 className="text-xl font-bold text-black mb-3">Enhanced Customer Interaction</h3>
              <p className="text-gray-600">
                Give customers a deeper understanding of your products with AI-powered conversations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <BarChart className="h-10 w-10 text-black mb-4" />
              <h3 className="text-xl font-bold text-black mb-3">Live Dashboard</h3>
              <p className="text-gray-600">
                Monitor customer interactions in real-time and gain valuable insights into their needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <Zap className="h-10 w-10 text-black mb-4" />
              <h3 className="text-xl font-bold text-black mb-3">Advanced AI Models</h3>
              <p className="text-gray-600">
                Leverage highly trained language models with perfect context understanding and reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-gray-50">
        <div className="container mx-auto container-padding">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl mb-6">
                Why Choose Our Platform?
              </h2>
              <div className="space-y-4">
                {[
                  "Increase conversion rates by up to 40%",
                  "Reduce customer service inquiries by 60%",
                  "Personalized product recommendations",
                  "24/7 customer engagement",
                  "Seamless integration with your existing tools",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600">{benefit}</p>
                  </div>
                ))}
              </div>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6 text-base mt-8">
                <Link href="#">
                  See Case Studies <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative h-[400px] bg-gray-200 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-400 text-lg">Analytics Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-black text-white">
        <div className="container mx-auto container-padding">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your Sales?</h2>
            <p className="text-lg text-gray-300 max-w-[600px] mx-auto">
              Join {appBar.appTitle} today and create unforgettable customer experiences that drive growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-6 text-base">
                <Link
                  href={{
                    pathname: "/auth",
                    query: { authType: "signUp" },
                  }}
                >
                  Start Free Trial
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-base"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto container-padding">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-bold text-lg mb-4">{appBar.appTitle}</h3>
              <p className="text-gray-600 mb-4">Empowering sales teams with AI-powered customer engagement.</p>
              <div className="flex gap-4">{/* Social icons would go here */}</div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Case Studies", "Documentation"].map((item, i) => (
                  <li key={i}>
                    <Link href="#" className="text-gray-600 hover:text-black">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact"].map((item, i) => (
                  <li key={i}>
                    <Link href="#" className="text-gray-600 hover:text-black">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                {["Terms", "Privacy", "Cookies", "Licenses"].map((item, i) => (
                  <li key={i}>
                    <Link href="#" className="text-gray-600 hover:text-black">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} {appBar.appTitle}. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-sm text-gray-600 hover:text-black">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-black">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

