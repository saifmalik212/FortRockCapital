import { type NextRequest, NextResponse } from "next/server"

interface DCFRequest {
  ticker: string
  growthRate: number
  discountRate: number
  years: number
}

interface DCFResponse {
  currentPrice: number
  intrinsicValue: number
  upsideDownside: number
  cashFlows: Array<{ year: number; cashFlow: number }>
}

export async function POST(request: NextRequest) {
  try {
    const body: DCFRequest = await request.json()
    const { ticker, growthRate, discountRate, years } = body

    // Validate input
    if (!ticker || typeof growthRate !== "number" || typeof discountRate !== "number" || typeof years !== "number") {
      return NextResponse.json({ error: "Invalid input parameters" }, { status: 400 })
    }

    // Mock data - In a real implementation, you would:
    // 1. Fetch current stock price from a financial API (e.g., Alpha Vantage, Yahoo Finance)
    // 2. Get historical financial data (cash flows, revenue, etc.)
    // 3. Perform actual DCF calculations

    const mockCurrentPrice = 150.25 + (Math.random() - 0.5) * 20 // Random price around $150

    // Generate mock cash flows based on growth rate
    const baseCashFlow = 10000 // Base cash flow in millions
    const cashFlows = Array.from({ length: years }, (_, i) => ({
      year: 2025 + i,
      cashFlow: baseCashFlow * Math.pow(1 + growthRate / 100, i + 1),
    }))

    // Simple DCF calculation (simplified for demo)
    const terminalValue =
      (cashFlows[cashFlows.length - 1].cashFlow * (1 + growthRate / 100)) / (discountRate / 100 - growthRate / 100)
    const presentValueCashFlows = cashFlows.reduce((sum, cf, index) => {
      return sum + cf.cashFlow / Math.pow(1 + discountRate / 100, index + 1)
    }, 0)
    const presentValueTerminal = terminalValue / Math.pow(1 + discountRate / 100, years)

    // Assume 1 billion shares outstanding for simplicity
    const sharesOutstanding = 1000 // in millions
    const intrinsicValue = (presentValueCashFlows + presentValueTerminal) / sharesOutstanding

    const upsideDownside = ((intrinsicValue - mockCurrentPrice) / mockCurrentPrice) * 100

    const response: DCFResponse = {
      currentPrice: mockCurrentPrice,
      intrinsicValue: intrinsicValue,
      upsideDownside: upsideDownside,
      cashFlows: cashFlows,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("DCF calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate DCF" }, { status: 500 })
  }
} 