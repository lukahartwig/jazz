import { Organization, Request, RequestsList } from "@/schema";
import { useAccount, useCoState } from "jazz-react";
import { ID } from "jazz-tools";
import { useCallback, useEffect, useState } from "react";

interface RequestButtonProps {
  organization: Organization;
}

export function RequestButton({ organization }: RequestButtonProps) {
  const { me } = useAccount({
    resolve: { root: { requests: { requests: true } } },
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  // Get the organization's requests using useCoState
  const orgRequests = useCoState(RequestsList, organization.requests?.id, {
    resolve: true,
  });

  // Check if user has already requested access
  useEffect(() => {
    if (me && orgRequests) {
      const userRequest = Object.values(orgRequests).find(
        (request) => request?.account?.id === me.id,
      );
      setHasRequested(!!userRequest);
    }
  }, [me, orgRequests]);

  const requestAccess = useCallback(() => {
    console.log("Request button clicked");
    console.log("Me:", me);
    console.log("Organization:", organization);
    console.log("Organization requests:", orgRequests);
    console.log("Me root requests:", me?.root?.requests);

    if (!me) {
      setError("You must be logged in to request access");
      return;
    }

    if (!me.root?.requests?.requests) {
      setError("Could not access requests container");
      return;
    }

    if (!organization._owner) {
      setError("Organization has no owner");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Creating request...");
      // Create the request with the organization's owner as the owner
      const request = Request.create(
        {
          account: me,
          organization,
          status: "pending",
          requestedAt: new Date(),
        },
        { owner: organization._owner },
      );
      console.log("Request created:", request);

      // Add to organization's requests
      if (orgRequests) {
        console.log("Adding to organization requests...");
        orgRequests[request.id] = request;
        console.log("Organization requests after add:", orgRequests);
      } else {
        console.log("Organization has no requests container");
      }

      // Add to global requests
      console.log("Adding to global requests...");
      const globalRequests = me.root.requests.requests as RequestsList;
      globalRequests[request.id] = request;
      console.log("Global requests after add:", me.root.requests.requests);

      setHasRequested(true);
      setError(null);
    } catch (err) {
      console.error("Error creating request:", err);
      setError(
        `Failed to create request: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [me, organization, orgRequests]);

  return (
    <div>
      <button
        onClick={requestAccess}
        disabled={isLoading || hasRequested}
        className={`px-3 py-1 mx-6 ${
          isLoading || hasRequested
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white rounded`}
      >
        {isLoading
          ? "Creating request..."
          : hasRequested
            ? "Invite requested"
            : "Request Invite to Organization"}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
