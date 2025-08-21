'use client';

import { useState } from "react";
import { ethers } from "ethers";

const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const OYSTER_MARKET_ADDRESS = "0x9d95D61eA056721E358BC49fE995caBF3B86A34B";

// RPC URL for Arbitrum mainnet
const arbRpcUrl = "https://arb1.arbitrum.io/rpc";

// Your wallet private key (keep this secure, use env var)
const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY as string;

// Provider
const provider = new ethers.JsonRpcProvider(arbRpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
const operator = "0xe10fa12f580e660ecd593ea4119cebc90509d642"

import USDC_ABI from "./../../abis/token_abi.json";
import OYSTER_MARKET_ABI from "./../../abis/oyster_market_abi.json";

const API_BASE = "http://13.202.229.168:8080";
const REGION = "ap-south-1";
const IP_CHECK_RETRIES = 15; // same as Rust, configurable
const IP_CHECK_INTERVAL = 5000; // 5 seconds

// Global variable to store the IP
let globalJobIp: string | null = null;

export function getGlobalJobIp() {
  return globalJobIp;
}


export default function DeployOnOyster() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ip, setIp] = useState<string | null>(null);

  async function approveUSDC(amount: bigint, signer: ethers.Signer) {
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
    const signerAddr = await signer.getAddress();

    const currentAllowance: bigint = await usdc.allowance(
      signerAddr,
      OYSTER_MARKET_ADDRESS
    );

    if (currentAllowance < amount) {
      const tx = await usdc.approve(OYSTER_MARKET_ADDRESS, amount);
      await tx.wait();
      console.log("USDC approved:", tx.hash);
    } else {
      console.log("Allowance already sufficient");
    }
  }

  async function createNewOysterJob(
    metadata: string,
    providerAddr: string,
    rate: bigint,
    balance: bigint,
    signer: ethers.Signer
  ) {
    const market = new ethers.Contract(
      OYSTER_MARKET_ADDRESS,
      OYSTER_MARKET_ABI.abi,
      signer
    );

    const tx = await market.jobOpen(metadata, providerAddr, rate, balance);
    const receipt = await tx.wait();
    console.log("Job created:", tx.hash);

    const jobOpenedTopic = ethers.id(
      "JobOpened(bytes32,string,address,address,uint256,uint256,uint256)"
    );

    const log = receipt.logs.find((l: any) => l.topics[0] === jobOpenedTopic);

    if (log) {
      const jobId = log.topics[1];
      console.log("Found JobOpened event! Job ID:", jobId);
      return { receipt, jobId };
    }

    console.warn("JobOpened event not found in receipt");
    return { receipt, jobId: null };
  }

  async function fetchJobIp(jobId: string) {
    let lastResponse = "";
    for (let attempt = 1; attempt <= IP_CHECK_RETRIES; attempt++) {
      console.log(`Checking for IP (attempt ${attempt}/${IP_CHECK_RETRIES})`);
      try {
        const targetUrl = `${API_BASE}/ip?id=${jobId}&region=${REGION}`;

        // go through proxy
        const proxyUrl = `https://getattestation.hostedapp.work/get_ip?url=${encodeURIComponent(targetUrl)}`;

        const resp = await fetch(proxyUrl);

        const text = await resp.text();
        lastResponse = text;

        let json: any;
        try {
          json = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse response:", text);
          continue;
        }

        console.log("Response from IP endpoint (via proxy):", json);

        if (json.ip && json.ip !== "") {
          setIp(json.ip);
          return json.ip;
        }
      } catch (err) {
        console.error("Error fetching IP:", err);
      }

      console.log(`IP not found yet, waiting ${IP_CHECK_INTERVAL / 1000}s...`);
      await new Promise((res) => setTimeout(res, IP_CHECK_INTERVAL));
    }

    throw new Error(`IP not found after ${IP_CHECK_RETRIES} attempts. Last response: ${lastResponse}`);
  }

  const handleDeploy = async () => {
    setLoading(true);
    setMessage("");
    setIp(null);

    try {

      const balance = BigInt("80576");
      await approveUSDC(balance, signer);

      const metadataObj = {
        debug: false,
        family: "tuna",
        init_params: "ewogICJkaWdlc3QiOiAicDFZZmJJMGFrR052dFdGNlBjRzRJRDJGY28wVXZVNnFXMXdjTFFIbWxodz0iLAogICJwYXJhbXMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImRvY2tlci1jb21wb3NlLnltbCIsCiAgICAgICJjb250ZW50cyI6ICJjMlZ5ZG1salpYTTZDaUFnSXlCc2JHRnRZU0J3Y205NGVTQnpaWEoyYVdObENpQWdiR3hoYldGZmNISnZlSGs2Q2lBZ0lDQnBiV0ZuWlRvZ2EyRnNjR2wwWVRnNE9DOXZiR3hoYldGZllYSnROalE2TUM0d0xqRWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBaklFWnZjaUJoY20wMk5DQnplWE4wWlcwZ2RYTmxJR3RoYkhCcGRHRTRPRGd2YjJ4c1lXMWhYMkZ5YlRZME9qQXVNQzR4SUdGdVpDQm1iM0lnWVcxa05qUWdjM2x6ZEdWdElIVnpaU0JyWVd4d2FYUmhPRGc0TDI5c2JHRnRZVjloYldRMk5Eb3dMakF1TVFvZ0lDQWdZMjl1ZEdGcGJtVnlYMjVoYldVNklHeHNZVzFoWDNCeWIzaDVDaUFnSUNCcGJtbDBPaUIwY25WbENpQWdJQ0J1WlhSM2IzSnJYMjF2WkdVNklHaHZjM1FLSUNBZ0lIWnZiSFZ0WlhNNkNpQWdJQ0FnSUMwZ0wyRndjQzlsWTJSellTNXpaV002TDJGd2NDOXpaV053TG5ObFl3b0tJQ0FqSUU5c2JHRnRZU0J6WlhKMmFXTmxDaUFnYjJ4c1lXMWhYM05sY25abGNqb0tJQ0FnSUdsdFlXZGxPaUJoYkhCcGJtVXZiMnhzWVcxaE9qQXVNVEF1TVFvZ0lDQWdZMjl1ZEdGcGJtVnlYMjVoYldVNklHOXNiR0Z0WVY5elpYSjJaWElLSUNBZ0lHbHVhWFE2SUhSeWRXVUtJQ0FnSUc1bGRIZHZjbXRmYlc5a1pUb2dhRzl6ZEFvZ0lDQWdhR1ZoYkhSb1kyaGxZMnM2Q2lBZ0lDQWdJSFJsYzNRNklGc2lRMDFFTFZOSVJVeE1JaXdnSW05c2JHRnRZU0F0TFhabGNuTnBiMjRpWFFvZ0lDQWdJQ0JwYm5SbGNuWmhiRG9nTVRCekNpQWdJQ0FnSUhKbGRISnBaWE02SURNS0NpQWdJeUJQYkd4aGJXRWdiVzlrWld3Z2NuVnVDaUFnYjJ4c1lXMWhYMjF2WkdWc09nb2dJQ0FnYVcxaFoyVTZJR0ZzY0dsdVpTOXZiR3hoYldFNk1DNHhNQzR4Q2lBZ0lDQmpiMjUwWVdsdVpYSmZibUZ0WlRvZ2IyeHNZVzFoWDIxdlpHVnNYMnhzWVcxaE15NHlDaUFnSUNCamIyMXRZVzVrT2lCd2RXeHNJR3hzWVcxaE15NHlDaUFnSUNCcGJtbDBPaUIwY25WbENpQWdJQ0J1WlhSM2IzSnJYMjF2WkdVNklHaHZjM1FLSUNBZ0lHUmxjR1Z1WkhOZmIyNDZDaUFnSUNBZ0lHOXNiR0Z0WVY5elpYSjJaWEk2Q2lBZ0lDQWdJQ0FnWTI5dVpHbDBhVzl1T2lCelpYSjJhV05sWDJobFlXeDBhSGtLSUNBZ0lHaGxZV3gwYUdOb1pXTnJPZ29nSUNBZ0lDQjBaWE4wT2lCYklrTk5SQzFUU0VWTVRDSXNJQ0p2Ykd4aGJXRWdjMmh2ZHlCc2JHRnRZVE11TWlKZENpQWdJQ0FnSUhOMFlYSjBYM0JsY21sdlpEb2dNbTB6TUhNS0lDQWdJQ0FnYVc1MFpYSjJZV3c2SURNd2N3b2dJQ0FnSUNCeVpYUnlhV1Z6T2lBeiIsCiAgICAgICJzaG91bGRfYXR0ZXN0IjogdHJ1ZSwKICAgICAgInNob3VsZF9kZWNyeXB0IjogZmFsc2UKICAgIH0KICBdCn0=",
        instance: "c6g.2xlarge",
        memory: 8192,
        name: "",
        region: "ap-south-1",
        url: "https://artifacts.marlin.org/oyster/eifs/base-blue_v3.0.0_linux_arm64.eif",
        vcpu: 4
      };

      const metadata = JSON.stringify(metadataObj);
      const rate = BigInt("53717366027832"); 

      const { receipt, jobId } = await createNewOysterJob(
        metadata,
        operator,
        rate,
        balance,
        signer
      );

      setMessage(`Job created in tx: ${receipt.transactionHash}`);

      if (jobId) {
        setMessage(`Job created! Waiting 3 minutes before fetching IP...`);
        // Wait 3 minutes (180000 ms)
        await new Promise((res) => setTimeout(res, 180000));

        const foundIp = await fetchJobIp(jobId);
        globalJobIp = foundIp;
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <button
        onClick={handleDeploy}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md shadow"
      >
        {loading ? "Deploying Job..." : "Deploy on Oyster"}
      </button>
      {message && <p className="text-gray-700">{message}</p>}
      {ip && <p className="text-green-600">Server IP: {ip}</p>}
    </div>
  );
}
