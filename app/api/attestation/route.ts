import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { attestationIp, verificationIp } = await request.json();
    
    // Default IPs if not provided
    const attIp = attestationIp || process.env.NEXT_PUBLIC_LLAMA_INSTANCE_IP || "52.66.158.206";
    const verifyIp = verificationIp || "13.201.207.60";

    console.log(`Starting attestation from ${attIp}:1301/attestation/raw`);
    
    // Step 1: Get attestation data
    const attestationResponse = await fetch(`http://${attIp}:1301/attestation/raw`, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
      },
    });

    if (!attestationResponse.ok) {
      throw new Error(`Attestation request failed with status ${attestationResponse.status}`);
    }

    // Get the raw binary data
    const attestationData = await attestationResponse.arrayBuffer();
    console.log(`Received attestation data: ${attestationData.byteLength} bytes`);

    // Step 2: Send attestation data to verification endpoint
    console.log(`Sending attestation data to ${verifyIp}:1400/verify/raw`);
    
    const verificationResponse = await fetch(`http://${verifyIp}:1400/verify/raw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: attestationData,
    });

    if (!verificationResponse.ok) {
      throw new Error(`Verification request failed with status ${verificationResponse.status}`);
    }

    // Get verification result
    const verificationResult = await verificationResponse.text();
    console.log('Verification result:', verificationResult);

    // Extract headers for additional info
    const responseHeaders: Record<string, string> = {};
    verificationResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      success: true,
      attestationSize: attestationData.byteLength,
      verificationResult: verificationResult,
      responseHeaders: responseHeaders,
      attestationIp: attIp,
      verificationIp: verifyIp,
      message: 'Attestation and verification completed successfully'
    });

  } catch (error: any) {
    console.error("Error in attestation/verification process:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        message: 'Attestation or verification failed'
      },
      { status: 500 }
    );
  }
}
