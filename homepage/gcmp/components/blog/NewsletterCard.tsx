import { SiBluesky, SiX } from "@icons-pack/react-simple-icons";
import { Card } from "gcmp-design-system/src/app/components/atoms/Card";
import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { NewsletterForm } from "gcmp-design-system/src/app/components/organisms/NewsletterForm";
import Link from "next/link";

export function NewsletterCard() {
  return (
    <Card className="p-4 md:py-16">
      <div className="lg:max-w-3xl md:text-center mx-auto space-y-6">
        <p className="uppercase text-primary tracking-widest text-sm font-medium ">
          Stay up to date
        </p>
        <H2>Subscribe to our newsletter</H2>
        <div className="flex justify-center">
          <NewsletterForm />
        </div>

        <p>
          <SiBluesky className="inline-block w-3.5 h-3.5 relative -top-px" />{" "}
          follow{" "}
          <Link className="underline" href="https://bsky.app/profile/garden.co">
            @garden.co
          </Link>{" "}
          &{" "}
          <Link
            className="underline"
            href="https://bsky.app/profile/jazz.tools"
          >
            @jazz.tools
          </Link>
          <br />
          <SiX className="inline-block w-3 h-3 relative -top-px" /> follow{" "}
          <Link className="underline" href="https://x.com/gardendotco">
            @gardendotco
          </Link>{" "}
          &{" "}
          <Link className="underline" href="https://x.com/jazz_tools">
            @jazz_tools
          </Link>
        </p>

        <p>
          Want to build something with Jazz?{" "}
          <Link className="underline" href="https://discord.gg/utDMjHYg42">
            Join the Jazz Discord!
          </Link>
        </p>
      </div>
    </Card>
  );
}
