import { NextResponse } from "next/server"
import { BASE_URL } from "../api"

export async function POST(request) {
  try {
    const data = await request.json()

    // Ensure isFullCart is always false as requested
    if (data.orderDetails) {
      data.orderDetails.isFullCart = false
    }


    // Get the base URL from environment variable or use a default
    const baseUrl = BASE_URL
    const checkoutUrl = `${baseUrl}/stripe/process-checkout`

    // Send the data to your backend
    const response = await fetch(checkoutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    let responseData

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json()
    } else {
      // If not JSON, get the text and log it
      const textResponse = await response.text()
      console.error("Non-JSON response from backend:", textResponse)
      return NextResponse.json({ error: "Backend returned an invalid response format" }, { status: 502 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: responseData.message || "Payment failed" }, { status: response.status })
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Checkout API Error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
