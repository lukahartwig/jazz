import { Organization } from "@/schema";
import { useAccount } from "jazz-react";
import { Account, Group } from "jazz-tools";
import { useCallback } from "react";
import { Request } from "../schema";

interface RequestsProps {
  organization: Organization;
}

export function Requests({ organization }: RequestsProps) {
  const { me } = useAccount({
    resolve: {
      root: {
        requests: {
          requests: {
            $each: true,
          },
        },
      },
    },
  });

  const handleRequest = useCallback(
    (request: Request, approved: boolean) => {
      if (
        !organization._owner?.castAs(Group) ||
        !request._owner.castAs(Account)
      )
        return;

      request.status = approved ? "approved" : "rejected";

      if (approved) {
        // Add the requester as a writer to the organization's group
        const organizationGroup = organization._owner.castAs(Group);
        const requester = request._owner.castAs(Account);

        // First remove any existing roles
        organizationGroup.removeMember(requester);
        // Then add as a writer
        organizationGroup.addMember(requester, "writer");

        if (organization.publicData) {
          organization.publicData.memberCount += 1;
        }
      }
    },
    [organization],
  );

  // Get all requests for this organization
  const organizationRequests = Object.entries(organization.requests || {})
    .map(([_, request]) => request)
    .filter(
      (request): request is Request =>
        request !== null && request !== undefined && "status" in request,
    );

  return (
    <div className="divide-y">
      {organizationRequests.length === 0 ? (
        <p className="p-4 text-gray-500">No requests</p>
      ) : (
        organizationRequests.map((request) => (
          <div key={request.id} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="font-medium">
                {request._owner?.castAs(Account).profile?.name || "Anonymous"}
              </p>
              <p className="text-sm text-gray-500">
                Requested at: {request.requestedAt.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Status: {request.status}</p>
            </div>
            {request.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequest(request, true)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRequest(request, false)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
