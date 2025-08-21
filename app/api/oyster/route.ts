import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const instanceIp = process.env.NEXT_PUBLIC_LLAMA_INSTANCE_IP || "52.66.158.206";
    
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

    // Extract the headers we need
    const oysterSignature = response.headers.get('x-oyster-signature');
    const oysterTimestamp = response.headers.get('x-oyster-timestamp');
    
    const data = await response.json();
    
    // Create response with the data and preserve the headers
    const nextResponse = NextResponse.json({
      ...data,
      oysterSignature,
      oysterTimestamp
    });
    
    // Also set the headers in the response for direct access
    if (oysterSignature) {
      nextResponse.headers.set('x-oyster-signature', oysterSignature);
    }
    if (oysterTimestamp) {
      nextResponse.headers.set('x-oyster-timestamp', oysterTimestamp);
    }
    
    return nextResponse;
  } catch (error: any) {
    console.error("Error in Oyster API proxy:", error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
