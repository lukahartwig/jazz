import { useParams } from "react-router";

import { PetAccount, PetPost, PetReactions, ReactionTypes } from "./1_schema";

import { ProgressiveImg, useAccount } from "jazz-react";
import { useCoState } from "jazz-react";
import { Loaded } from "jazz-tools";
import uniqolor from "uniqolor";
import { Button, Skeleton } from "./basicComponents";
import { ShareButton } from "./components/ShareButton";

/** Walkthrough: TODO
 */

const reactionEmojiMap: {
  [reaction in (typeof ReactionTypes)[number]]: string;
} = {
  aww: "😍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  tiny: "🐥",
  chonkers: "🐘",
};

export function RatePetPostUI() {
  const petPostID = useParams<{ petPostId: string }>().petPostId;

  const { me } = useAccount(PetAccount);
  const petPost = useCoState(PetPost, petPostID);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">{petPost?.name}</h1>
        <ShareButton petPost={petPost} />
      </div>

      <ProgressiveImg image={petPost?.image as any /* TODO: fix this */}>
        {({ src }) => <img className="w-80 max-w-full rounded" src={src} />}
      </ProgressiveImg>

      <div className="flex justify-between max-w-xs flex-wrap">
        {ReactionTypes.map((reactionType) => (
          <Button
            key={reactionType}
            variant={
              petPost?.reactions?.byMe?.value === reactionType
                ? "default"
                : "outline"
            }
            onClick={() => {
              petPost?.reactions?.push(reactionType);
            }}
            title={`React with ${reactionType}`}
            className="text-2xl px-2"
            data-selected={petPost?.reactions?.byMe?.value === reactionType}
          >
            {reactionEmojiMap[reactionType]}
          </Button>
        ))}
      </div>

      {petPost && me?.canAdmin(petPost) && petPost.reactions && (
        <ReactionOverview petReactions={petPost.reactions} />
      )}
    </div>
  );
}

function ReactionOverview({
  petReactions,
}: { petReactions: Loaded<typeof PetReactions> }) {
  return (
    <div>
      <h2>Reactions</h2>
      <div className="flex flex-col gap-1">
        {ReactionTypes.map((reactionType) => {
          const reactionsOfThisType = Object.values(
            petReactions.perAccount,
          ).filter((entry) => entry.value === reactionType);

          if (reactionsOfThisType.length === 0) return null;

          return (
            <div className="flex gap-2 items-center" key={reactionType}>
              {reactionEmojiMap[reactionType]}{" "}
              {reactionsOfThisType.map((reaction, idx) =>
                reaction.by?.profile?.name ? (
                  <span
                    className="rounded-full py-0.5 px-2 text-xs"
                    style={uniqueColoring(reaction.by?.id ?? "")}
                    key={reaction.by?.id ?? ""}
                  >
                    {reaction.by?.profile?.name}
                  </span>
                ) : (
                  <Skeleton
                    className="mt-1 w-[50px] h-[1em] rounded-full"
                    key={idx}
                  />
                ),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function uniqueColoring(seed: string) {
  const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return {
    color: uniqolor(seed, { lightness: darkMode ? 80 : 20 }).color,
    background: uniqolor(seed, { lightness: darkMode ? 20 : 80 }).color,
  };
}
