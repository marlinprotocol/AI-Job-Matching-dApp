import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const instanceIp = process.env.NEXT_PUBLIC_LLAMA_INSTANCE_IP || "localhost";
    
    const response = await fetch(`http://${instanceIp}:5000/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract Oyster headers from the response
    const oysterSignature = response.headers.get('x-oyster-signature');
    const oysterTimestamp = response.headers.get('x-oyster-timestamp');
    
    // Log the headers for debugging
    console.log('=== Generate API Oyster Headers ===');
    console.log('x-oyster-signature:', oysterSignature);
    console.log('x-oyster-timestamp:', oysterTimestamp);
    
    // Create response with headers included in the data
    const responseData = {
      ...data,
      oysterSignature: oysterSignature,
      oysterTimestamp: oysterTimestamp
    };
    
    // Create NextResponse and also set headers
    const nextResponse = NextResponse.json(responseData);
    
    // Forward the Oyster headers in the response
    if (oysterSignature) {
      nextResponse.headers.set('x-oyster-signature', oysterSignature);
    }
    if (oysterTimestamp) {
      nextResponse.headers.set('x-oyster-timestamp', oysterTimestamp);
    }
    
    return nextResponse;
  } catch (error: any) {
    console.error("Error in API proxy:", error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
