// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Users, BarChart, Zap, ArrowRight, CheckCircle } from "lucide-react"
// import { getServerSession } from "next-auth"
// import { authOptions } from "@/lib/auth-options"
// import { appBar } from "@/constants/appBar"

// export default async function LandingPage() {
//   const session = await getServerSession(authOptions)

//   return (
//     <div className="flex min-h-screen flex-col bg-white">
//       {/* Hero Section */}
//       <section className="relative overflow-hidden border-b border-gray-100 py-20 md:py-28 lg:py-32">
//         <div
//           className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#f5f5f5,transparent)]"
//           aria-hidden="true"
//         ></div>
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
//           <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
//             <div className="space-y-8">
//               <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl md:text-6xl/none">
//                 Empower Your <span className="gradient-text">Customer Sales</span> Strategy
//               </h1>
//               <p className="text-lg text-gray-600 max-w-[600px]">
//                 Let your customers choose the best products for their needs with our AI-powered sales assistant. Connect
//                 with customers like never before.
//               </p>
//               <div className="flex flex-wrap gap-4">
//                 <Button className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors rounded-full px-8 py-6 text-base">
//                   <Link
//                     href={{
//                       pathname: "/auth",
//                       query: { authType: "signUp" },
//                     }}
//                   >
//                     Get Started
//                   </Link>
//                 </Button>
//                 <Button
//                   variant="outline"
//                   className="border-black text-black hover:bg-black hover:text-white transition-colors rounded-full px-8 py-6 text-base"
//                 >
//                   Learn More
//                 </Button>
//               </div>
//             </div>
//             <div className="relative h-[400px] lg:h-[500px] bg-gray-100 rounded-2xl overflow-hidden">
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <span className="text-gray-400 text-lg">Dashboard Preview</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Social Proof */}
//       <section className="bg-gray-50 py-12">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
//             <p className="text-sm font-medium text-gray-500 w-full text-center mb-6 md:mb-0 md:w-auto">
//               TRUSTED BY INNOVATIVE COMPANIES
//             </p>
//             <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center w-full md:w-auto">
//               {["Company 1", "Company 2", "Company 3", "Company 4"].map((company, i) => (
//                 <div key={i} className="text-gray-400 font-semibold">
//                   {company}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-20 md:py-28 lg:py-32 bg-white">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl mb-4">
//               Powerful Features for Modern Sales Teams
//             </h2>
//             <p className="text-lg text-gray-600 max-w-[700px] mx-auto">
//               Our platform combines cutting-edge AI with intuitive design to transform your customer interactions.
//             </p>
//           </div>

//           <div className="grid gap-10 md:grid-cols-3">
//             <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
//               <Users className="h-10 w-10 text-black mb-4" />
//               <h3 className="text-xl font-bold text-black mb-3">Enhanced Customer Interaction</h3>
//               <p className="text-gray-600">
//                 Give customers a deeper understanding of your products with AI-powered conversations.
//               </p>
//             </div>

//             <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
//               <BarChart className="h-10 w-10 text-black mb-4" />
//               <h3 className="text-xl font-bold text-black mb-3">Live Dashboard</h3>
//               <p className="text-gray-600">
//                 Monitor customer interactions in real-time and gain valuable insights into their needs.
//               </p>
//             </div>

//             <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
//               <Zap className="h-10 w-10 text-black mb-4" />
//               <h3 className="text-xl font-bold text-black mb-3">Advanced AI Models</h3>
//               <p className="text-gray-600">
//                 Leverage highly trained language models with perfect context understanding and reasoning.
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Benefits Section */}
//       <section className="py-20 md:py-28 lg:py-32 bg-gray-50">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid gap-12 lg:grid-cols-2 items-center">
//             <div className="space-y-8">
//               <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl mb-6">
//                 Why Choose Our Platform?
//               </h2>
//               <div className="space-y-6">
//                 {[
//                   "Increase conversion rates by up to 40%",
//                   "Reduce customer service inquiries by 60%",
//                   "Personalized product recommendations",
//                   "24/7 customer engagement",
//                   "Seamless integration with your existing tools",
//                 ].map((benefit, i) => (
//                   <div key={i} className="flex items-start gap-3">
//                     <CheckCircle className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
//                     <p className="text-gray-600">{benefit}</p>
//                   </div>
//                 ))}
//               </div>
//               <Button className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors rounded-full px-8 py-6 text-base">
//                 <Link href="#">
//                   See Case Studies <ArrowRight className="ml-2 h-4 w-4" />
//                 </Link>
//               </Button>
//             </div>
//             <div className="relative h-[400px] bg-gray-200 rounded-2xl overflow-hidden">
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <span className="text-gray-400 text-lg">Analytics Preview</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 md:py-28 lg:py-32 bg-black text-white">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="max-w-3xl mx-auto text-center space-y-8">
//             <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your Sales?</h2>
//             <p className="text-lg text-gray-300 max-w-[600px] mx-auto">
//               Join {appBar.appTitle} today and create unforgettable customer experiences that drive growth.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-6 text-base">
//                 <Link
//                   href={{
//                     pathname: "/auth",
//                     query: { authType: "signUp" },
//                   }}
//                 >
//                   Start Free Trial
//                 </Link>
//               </Button>
//               <Button
//                 variant="outline"
//                 className="border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-base"
//               >
//                 Schedule Demo
//               </Button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-white border-t border-gray-100 py-12">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid gap-8 md:grid-cols-4">
//             <div>
//               <h3 className="font-bold text-lg mb-4">{appBar.appTitle}</h3>
//               <p className="text-gray-600 mb-4">Empowering sales teams with AI-powered customer engagement.</p>
//               <div className="flex gap-4">{/* Social icons would go here */}</div>
//             </div>

//             <div>
//               <h4 className="font-semibold mb-4">Product</h4>
//               <ul className="space-y-2">
//                 {["Features", "Pricing", "Case Studies", "Documentation"].map((item, i) => (
//                   <li key={i}>
//                     <Link href="#" className="text-gray-600 hover:text-black">
//                       {item}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h4 className="font-semibold mb-4">Company</h4>
//               <ul className="space-y-2">
//                 {["About", "Blog", "Careers", "Contact"].map((item, i) => (
//                   <li key={i}>
//                     <Link href="#" className="text-gray-600 hover:text-black">
//                       {item}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h4 className="font-semibold mb-4">Legal</h4>
//               <ul className="space-y-2">
//                 {["Terms", "Privacy", "Cookies", "Licenses"].map((item, i) => (
//                   <li key={i}>
//                     <Link href="#" className="text-gray-600 hover:text-black">
//                       {item}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>

//           <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
//             <p className="text-sm text-gray-600">
//               © {new Date().getFullYear()} {appBar.appTitle}. All rights reserved.
//             </p>
//             <div className="flex gap-6 mt-4 md:mt-0">
//               <Link href="#" className="text-sm text-gray-600 hover:text-black">
//                 Terms of Service
//               </Link>
//               <Link href="#" className="text-sm text-gray-600 hover:text-black">
//                 Privacy Policy
//               </Link>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, CheckCircle, MessageSquare, BarChartIcon as ChartBar, Sparkles, Shield } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { appBar } from "@/constants/appBar"

export default async function LandingPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 py-20 md:py-28 lg:py-32">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#f5f5f5,transparent)]"
          aria-hidden="true"
        ></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm">
                <span className="mr-1 rounded-full bg-black px-1.5 py-0.5 text-xs text-white">New</span>
                <span className="text-gray-600">AI-powered customer engagement</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl md:text-6xl/none">
                Transform Your <span className="gradient-text">Customer Sales</span> Strategy
              </h1>
              <p className="text-lg text-gray-600 max-w-[600px]">
                Let your customers choose the best products for their needs with our AI-powered sales assistant. Connect
                with customers like never before and boost your conversion rates.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors rounded-full px-8 py-6 text-base">
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
                  className="border-black text-black hover:bg-black hover:text-white transition-colors rounded-full px-8 py-6 text-base"
                >
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                      style={{
                        backgroundColor: `hsl(${i * 60}, 70%, 90%)`,
                      }}
                    />
                  ))}
                </div>
                <div>
                  <span className="font-medium">500+</span> companies trust us
                </div>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] bg-gray-100 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 to-gray-900/5 z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4 z-20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">AI Assistant</h3>
                      <p className="text-xs text-gray-500">Online now</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
                      <p className="text-sm">Hi there! How can I help you choose the right product today?</p>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-black p-3 rounded-lg rounded-tr-none max-w-[80%] text-white">
                        <p className="text-sm">I'm looking for a new laptop for graphic design work.</p>
                      </div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
                      <p className="text-sm">
                        Great! For graphic design, I'd recommend our ProDesign X7 with 32GB RAM and dedicated GPU...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <p className="text-sm font-medium text-gray-500 w-full text-center mb-6 md:mb-0 md:w-auto">
              TRUSTED BY INNOVATIVE COMPANIES
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center w-full md:w-auto">
              {["Company 1", "Company 2", "Company 3", "Company 4"].map((company, i) => (
                <div key={i} className="text-gray-400 font-semibold">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enhanced Customer Interaction</h3>
              <p className="text-gray-600">
                Give customers a deeper understanding of your products with AI-powered conversations that adapt to their
                needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <ChartBar className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">
                Monitor customer interactions in real-time and gain valuable insights into their needs and preferences.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Advanced AI Models</h3>
              <p className="text-gray-600">
                Leverage highly trained language models with perfect context understanding and reasoning capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Proven Results</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Our platform has helped businesses of all sizes improve their customer engagement and drive sales.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">45%</p>
              <p className="text-gray-300 text-sm">Increase in Conversion</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">24/7</p>
              <p className="text-gray-300 text-sm">Customer Support</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">500+</p>
              <p className="text-gray-300 text-sm">Happy Clients</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">98%</p>
              <p className="text-gray-300 text-sm">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl mb-6">
                Why Choose Our Platform?
              </h2>
              <div className="space-y-6">
                {[
                  "Increase conversion rates by up to 40%",
                  "Reduce customer service inquiries by 60%",
                  "Personalized product recommendations",
                  "24/7 customer engagement",
                  "Seamless integration with your existing tools",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="rounded-full bg-black p-1.5 flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-600">{benefit}</p>
                  </div>
                ))}
              </div>
              <Button className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors rounded-full px-8 py-6 text-base">
                <Link href="#">
                  See Case Studies <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative h-[400px] bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="space-y-6 w-full">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Enterprise-Grade Security</h3>
                      <p className="text-sm text-gray-500">Your data is protected with end-to-end encryption</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-black h-full w-[85%]"></div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-black h-full w-[65%]"></div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-black h-full w-[90%]"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-black">87%</p>
                      <p className="text-sm text-gray-500">Customer Retention</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-black">24/7</p>
                      <p className="text-sm text-gray-500">AI Availability</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-[700px] mx-auto">
              Don't just take our word for it. Here's what our customers have to say about our platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "This platform has completely transformed how we engage with our customers. Our conversion rates have increased by 45% since implementation.",
                author: "Sarah Johnson",
                role: "VP of Sales, TechCorp",
              },
              {
                quote:
                  "The AI assistant feels incredibly natural. Our customers often don't realize they're talking to an AI until we tell them!",
                author: "Michael Chen",
                role: "Customer Success Manager, Retail Plus",
              },
              {
                quote:
                  "We've been able to provide 24/7 support without increasing our team size. The ROI has been incredible.",
                author: "Jessica Williams",
                role: "COO, Global Services",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 lg:py-32 bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-bold text-lg mb-4">{appBar.appTitle}</h3>
              <p className="text-gray-600 mb-4">Empowering sales teams with AI-powered customer engagement.</p>
              <div className="flex gap-4">
                {["twitter", "facebook", "instagram", "linkedin"].map((social) => (
                  <a key={social} href="#" className="text-gray-400 hover:text-gray-800">
                    <span className="sr-only">{social}</span>
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs">{social[0].toUpperCase()}</span>
                    </div>
                  </a>
                ))}
              </div>
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
