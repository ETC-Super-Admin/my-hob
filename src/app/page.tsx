'use client';

import {Button} from "@heroui/react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to HeroUI</h1>
      <Button color="primary">Click me</Button>
    </main>
  );
}
