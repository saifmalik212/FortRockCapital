"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calculator,
  HelpCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface DCFResult {
  currentPrice: number
  intrinsicValue: number
  upsideDownside: number
  cashFlows: Array<{ year: number; cashFlow: number }>
}

export default function ClientPortal() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [ticker, setTicker] = useState("")
  const [growthRate, setGrowthRate] = useState([3])
  const [discountRate, setDiscountRate] = useState([10])
  const [years, setYears] = useState([5])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DCFResult | null>(null)
  const [error, setError] = useState("")

  // Authentication check
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [user, isAuthLoading, router]);

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleCalculate = async () => {
    if (!ticker.trim()) {
      setError("Please enter a stock ticker")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/dcf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          growthRate: growthRate[0],
          discountRate: discountRate[0],
          years: years[0],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch DCF data")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      // Mock data for demonstration
      const mockData: DCFResult = {
        currentPrice: 150.25,
        intrinsicValue: 180.5,
        upsideDownside: 20.1,
        cashFlows: Array.from({ length: years[0] }, (_, i) => ({
          year: 2025 + i,
          cashFlow: 10000 * Math.pow(1 + growthRate[0] / 100, i),
        })),
      }
      setResult(mockData)
      setError("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="bg-white text-black border-gray-300 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm font-mono">FR</span>
              </div>
              <span className="text-xl font-bold text-black font-mono">FortRock Capital</span>
            </div>
          </div>
          <div className="text-sm text-gray-600 font-mono">Client Portal</div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2 font-mono">Welcome to Your Client Portal</h1>
            <p className="text-gray-600 font-mono">Access your portfolio analytics and financial tools</p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="dcf" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="dcf" className="flex items-center space-x-2 font-mono">
                <Calculator className="h-4 w-4" />
                <span>DCF Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center space-x-2 font-mono">
                <PieChart className="h-4 w-4" />
                <span>Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2 font-mono">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center space-x-2 font-mono">
                <DollarSign className="h-4 w-4" />
                <span>Reports</span>
              </TabsTrigger>
            </TabsList>

            {/* DCF Calculator Tab */}
            <TabsContent value="dcf">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <Card className="border-gray-200 font-mono">
                  <CardHeader>
                    <CardTitle className="text-black flex items-center font-mono">
                      DCF Calculator
                      <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-mono">
                      Calculate the intrinsic value of stocks using Discounted Cash Flow analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Stock Ticker */}
                    <div>
                      <Label htmlFor="ticker" className="text-black font-medium font-mono">
                        Stock Ticker
                      </Label>
                      <Input
                        id="ticker"
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
                        placeholder="e.g., AAPL"
                      />
                    </div>

                    {/* Growth Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-black font-medium flex items-center font-mono">
                          Growth Rate
                          <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                        </Label>
                        <span className="text-sm font-medium text-blue-600 font-mono">{growthRate[0]}%</span>
                      </div>
                      <Slider
                        value={growthRate}
                        onValueChange={setGrowthRate}
                        max={10}
                        min={0}
                        step={0.5}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
                        <span>0%</span>
                        <span>10%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">Expected annual growth rate of free cash flows</p>
                    </div>

                    {/* Discount Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-black font-medium flex items-center font-mono">
                          Discount Rate (WACC)
                          <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                        </Label>
                        <span className="text-sm font-medium text-blue-600 font-mono">{discountRate[0]}%</span>
                      </div>
                      <Slider
                        value={discountRate}
                        onValueChange={setDiscountRate}
                        max={15}
                        min={5}
                        step={0.5}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
                        <span>5%</span>
                        <span>15%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">Rate to discount future cash flows (e.g., WACC)</p>
                    </div>

                    {/* Number of Years */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-black font-medium flex items-center font-mono">
                          Projection Years
                          <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                        </Label>
                        <span className="text-sm font-medium text-blue-600 font-mono">{years[0]} years</span>
                      </div>
                      <Slider value={years} onValueChange={setYears} max={10} min={1} step={1} className="mt-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
                        <span>1 year</span>
                        <span>10 years</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">Years to project cash flows before terminal value</p>
                    </div>

                    {/* Calculate Button */}
                    <Button
                      onClick={handleCalculate}
                      disabled={loading}
                      className="w-full bg-black text-white hover:bg-gray-800 font-mono"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-4 w-4" />
                          Calculate DCF
                        </>
                      )}
                    </Button>

                    {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md font-mono">{error}</div>}
                  </CardContent>
                </Card>

                {/* Results Display */}
                <Card className="border-gray-200 font-mono">
                  <CardHeader>
                    <CardTitle className="text-black font-mono">Analysis Results</CardTitle>
                    <CardDescription className="text-gray-600 font-mono">
                      {result ? `DCF analysis for ${ticker}` : "Results will appear here after calculation"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result ? (
                      <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg font-mono">
                            <div className="text-sm text-gray-600 mb-1">Current Price</div>
                            <div className="text-2xl font-bold text-black">${result.currentPrice.toFixed(2)}</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg font-mono">
                            <div className="text-sm text-gray-600 mb-1">Intrinsic Value</div>
                            <div className="text-2xl font-bold text-black">${result.intrinsicValue.toFixed(2)}</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg font-mono">
                            <div className="text-sm text-gray-600 mb-1">Upside/Downside</div>
                            <div
                              className={`text-2xl font-bold flex items-center justify-center ${
                                result.upsideDownside > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {result.upsideDownside > 0 ? (
                                <TrendingUp className="h-5 w-5 mr-1" />
                              ) : (
                                <TrendingDown className="h-5 w-5 mr-1" />
                              )}
                              {result.upsideDownside > 0 ? "+" : ""}
                              {result.upsideDownside.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Valuation Summary */}
                        <div className="p-4 bg-blue-50 rounded-lg font-mono">
                          <h3 className="font-semibold text-black mb-2">Valuation Summary</h3>
                          <p className="text-sm text-gray-700">
                            Based on a {growthRate[0]}% growth rate and {discountRate[0]}% discount rate over {years[0]}{" "}
                            years, the stock appears to be{" "}
                            <span
                              className={`font-semibold ${result.upsideDownside > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {result.upsideDownside > 0 ? "undervalued" : "overvalued"}
                            </span>{" "}
                            by {Math.abs(result.upsideDownside).toFixed(1)}%.
                          </p>
                        </div>

                        {/* Cash Flow Chart */}
                        <div>
                          <h3 className="font-semibold text-black mb-4 font-mono">Projected Cash Flows</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={result.cashFlows}>
                                <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                                <YAxis
                                  tick={{ fontSize: 12 }}
                                  axisLine={{ stroke: "#e5e7eb" }}
                                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                />
                                <Tooltip
                                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Cash Flow"]}
                                  labelStyle={{ color: "#000", fontFamily: "monospace" }}
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px",
                                    fontFamily: "monospace",
                                  }}
                                />
                                <Bar dataKey="cashFlow" fill="#000000" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 font-mono">
                        <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Enter a stock ticker and click "Calculate DCF" to see results</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <Card className="font-mono">
                <CardHeader>
                  <CardTitle className="text-black font-mono">Portfolio Overview</CardTitle>
                  <CardDescription className="text-gray-600 font-mono">
                    Your current portfolio allocation and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500 font-mono">
                    <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Portfolio data will be available soon</p>
                    <p className="text-sm mt-2">Connect with your portfolio manager to view your holdings</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card className="font-mono">
                <CardHeader>
                  <CardTitle className="text-black font-mono">Performance Analytics</CardTitle>
                  <CardDescription className="text-gray-600 font-mono">
                    Detailed analysis of your investment performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500 font-mono">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Analytics dashboard coming soon</p>
                    <p className="text-sm mt-2">Advanced AI-powered analytics and insights</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <Card className="font-mono">
                <CardHeader>
                  <CardTitle className="text-black font-mono">Financial Reports</CardTitle>
                  <CardDescription className="text-gray-600 font-mono">
                    Monthly and quarterly performance reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500 font-mono">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Reports will be available here</p>
                    <p className="text-sm mt-2">Comprehensive financial reports and statements</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 