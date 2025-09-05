import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-background text-foreground p-4 text-center animate-fade-in">
      <div className="max-w-2xl">
        <Image
          src="/flow-logo.png"
          alt="FlowClicker Logo"
          width={192}
          height={192}
          className="mx-auto mb-8 h-32 w-32 md:h-48 md:w-48"
          priority
        />
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-primary">
          FlowClicker
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          The simple, addictive clicker game where every click counts. Compete on a global scale, earn tokens, and become the top clicker in the world.
        </p>
        <div className="mt-8">
          <Link href="/game" passHref>
            <Button size="lg" className="text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300">
              <Flame className="mr-2 h-5 w-5" />
              Start Clicking!
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
