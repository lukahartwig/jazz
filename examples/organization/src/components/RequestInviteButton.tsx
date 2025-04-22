import { Organization, Request } from "@/schema";
import { useAccount } from "jazz-react";
import { useCallback } from "react";

interface RequestButtonProps {
  organization: Organization;
}

export function RequestButton({ organization }: RequestButtonProps) {
  const { me } = useAccount();
  console.log(organization);
  const requestAccess = useCallback(() => {
    if (!me?.root?.requests?.requests) return;

    const request = Request.create(
      {
        account: me,
        organization,
        status: "pending",
        requestedAt: new Date(),
      },
      { owner: me },
    );

    // Add to global requests
    me.root.requests.requests[request.id] = request;

    // Add to organization Requests
    if (organization.requests) {
      organization.requests[request.id] = request;
    }
  }, [me, organization]);

  return (
    <button onClick={requestAccess}>Request Invite to Organization</button>
  );
}
