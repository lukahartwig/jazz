import { HowToPlayContent } from "@/components/how-to-play-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/how-to-play")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div className="container mx-auto h-auto">
        <Card>
          <CardHeader>
            <CardTitle>How to play?</CardTitle>
          </CardHeader>
          <CardContent>
            <HowToPlayContent />
          </CardContent>
        </Card>
        Hello "/how-to-play"!
      </div>
    </div>
  );
}
