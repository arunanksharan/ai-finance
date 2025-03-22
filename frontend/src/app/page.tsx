"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Kuzushi Labs - AI Finance</h1>
        <p className="text-xl text-center mb-12">Advanced financial risk management tools</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>PFE Calculator</CardTitle>
              <CardDescription>
                Calculate Potential Future Exposure based on the SA-CCR framework
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Features include:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Multiple calculation methodologies</li>
                <li>Support for various asset classes</li>
                <li>Detailed exposure profiles</li>
                <li>CSV batch upload</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/pfe-calculator">
                  Open PFE Calculator
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Initial Margin Calculator</CardTitle>
              <CardDescription>
                Calculate Initial Margin using ISDA SIMM or Grid/Schedule approach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Features include:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>BCBS-IOSCO compliant calculations</li>
                <li>Support for all major asset classes</li>
                <li>Netting and collateral handling</li>
                <li>Detailed risk factor sensitivity</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/initial-margin-calculator">
                  Open IM Calculator
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
