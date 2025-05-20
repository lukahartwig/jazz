import { ChangeEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router";

import { ProgressiveImg } from "jazz-react";
import { createImage, useAccount, useCoState } from "jazz-react";
import { Group, Loaded, co, z } from "jazz-tools";
import { PetAccount, PetPost, PetReactions } from "./1_schema";
import { Button, Input } from "./basicComponents";

/** Walkthrough: TODO
 */

const PartialPetPost = co.map({
  name: z.string(),
  image: z.optional(co.image()),
  reactions: PetReactions,
});

export function NewPetPostForm() {
  const { me } = useAccount(PetAccount);
  const navigate = useNavigate();

  const [newPostId, setNewPostId] = useState<string | undefined>(undefined);

  const newPetPost = useCoState(PartialPetPost, newPostId);

  const onChangeName = useCallback(
    (name: string) => {
      if (!me) return;
      if (newPetPost) {
        newPetPost.name = name;
      } else {
        const petPostGroup = Group.create();
        const petPost = PartialPetPost.create(
          {
            name,
            reactions: PetReactions.create([], {
              owner: petPostGroup,
            }),
          },
          { owner: petPostGroup },
        );

        setNewPostId(petPost.id);
      }
    },
    [me, newPetPost],
  );

  const onImageSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!newPetPost || !event.target.files) return;

      const image = await createImage(event.target.files[0], {
        owner: newPetPost._owner,
      });

      newPetPost.image = image as any; // TODO: fix this
    },
    [newPetPost],
  );

  const onSubmit = useCallback(() => {
    if (!me || !newPetPost) return;
    const myPosts = me.root?.posts;

    if (!myPosts) {
      throw new Error("No posts list found");
    }

    if (!newPetPost.image) {
      throw new Error("No image found");
    }

    myPosts.push(newPetPost as Loaded<typeof PetPost>);

    navigate("/pet/" + newPetPost.id);
  }, [me?.root?.posts, newPetPost, navigate]);

  return (
    <div className="flex flex-col gap-10">
      <p>Share your pet with friends!</p>
      <Input
        type="text"
        placeholder="Pet Name"
        className="text-3xl py-6"
        onChange={(event) => onChangeName(event.target.value)}
        value={newPetPost?.name || ""}
      />

      {newPetPost?.image ? (
        <ProgressiveImg image={newPetPost.image as any /* TODO: fix this */}>
          {({ src }) => <img className="w-80 max-w-full rounded" src={src} />}
        </ProgressiveImg>
      ) : (
        <Input
          type="file"
          disabled={!newPetPost?.name}
          onChange={onImageSelected}
          data-testid="file-upload"
        />
      )}

      {newPetPost?.name && newPetPost?.image && (
        <Button onClick={onSubmit}>Submit Post</Button>
      )}
    </div>
  );
}
