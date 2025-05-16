import { createImage, useAccount, useCoState } from "jazz-react";
import { Account, CoPlainText, ID } from "jazz-tools";
import { MicIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { chatLikeGenerate, collaborate, record } from "soul-dev";
import { Chat, Message } from "./schema.ts";
import {
  BubbleBody,
  BubbleContainer,
  BubbleImage,
  BubbleInfo,
  BubbleText,
  ChatBody,
  EmptyChatMessage,
  ImageInput,
  InputBar,
  TextInput,
} from "./ui.tsx";

export function ChatScreen(props: { chatID: ID<Chat> }) {
  const chat = useCoState(Chat, props.chatID, { resolve: { $each: true } });
  const account = useAccount();
  const [showNLastMessages, setShowNLastMessages] = useState(30);

  const [agentAccount, setAgentAccount] = useState<Account | null>(null);

  useEffect(() => {
    Account.createAs(account.me, {
      creationProps: {
        name: "Agent",
      },
    }).then(setAgentAccount);
  }, []);

  useEffect(() => {
    if (!props.chatID || !chat || !agentAccount) return;

    return collaborate(Chat, props.chatID, {
      resolve: { $each: { text: true } },
      agentAccount,
      prompt: `Cheerfully respond to the user's messages by
        taking part in the conversation, creating your own messages.
        Delete offensive messages.`,
      apiKey: import.meta.env.VITE_HF_API_KEY,
    });
  }, [props.chatID, chat && chat.length > 0, agentAccount]);

  if (!chat)
    return (
      <div className="flex-1 flex justify-center items-center">Loading...</div>
    );

  const sendImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) return;

    if (file.size > 5000000) {
      alert("Please upload an image less than 5MB.");
      return;
    }

    createImage(file, { owner: chat._owner }).then((image) => {
      chat.push(
        Message.create(
          {
            text: CoPlainText.create(file.name, chat._owner),
            image: image,
          },
          chat._owner,
        ),
      );
    });
  };

  return (
    <>
      <ChatBody>
        {chat.length > 0 ? (
          chat
            .slice(-showNLastMessages)
            .reverse() // this plus flex-col-reverse on ChatBody gives us scroll-to-bottom behavior
            .map((msg) => <ChatBubble me={account.me} msg={msg} key={msg.id} />)
        ) : (
          <EmptyChatMessage />
        )}
        {chat.length > showNLastMessages && (
          <button
            className="px-4 py-1 block mx-auto my-2 border rounded"
            onClick={() => setShowNLastMessages(showNLastMessages + 10)}
          >
            Show more
          </button>
        )}
      </ChatBody>

      <InputBar>
        <ImageInput onImageChange={sendImage} />

        <TextInput
          onSubmit={(text) => {
            chat.push(
              Message.create(
                { text: CoPlainText.create(text, chat._owner) },
                chat._owner,
              ),
            );
          }}
        />

        <button
          onClick={() =>
            record({
              onNewChunk: (text) => {
                const message = Message.create(
                  { text: CoPlainText.create(text, chat._owner) },
                  chat._owner,
                );
                chat.push(message);
                return message;
              },
              onChunkEdited: (newText, chunk: Message) => {
                chunk.text?.applyDiff(newText);
              },
            })
          }
        >
          <MicIcon size={24} strokeWidth={1.5} />
        </button>
      </InputBar>
    </>
  );
}

function ChatBubble(props: { me: Account; msg: Message }) {
  if (!props.me.canRead(props.msg) || !props.msg.text?.toString()) {
    return (
      <BubbleContainer fromMe={false}>
        <BubbleBody fromMe={false}>
          <BubbleText
            text="Message not readable"
            className="text-gray-500 italic"
          />
        </BubbleBody>
      </BubbleContainer>
    );
  }

  const lastEdit = props.msg._edits.text;
  const fromMe = lastEdit.by?.isMe;
  const { text, image } = props.msg;

  return (
    <BubbleContainer fromMe={fromMe}>
      <BubbleBody fromMe={fromMe}>
        {image && <BubbleImage image={image} />}
        <BubbleText text={text} />
      </BubbleBody>
      <BubbleInfo by={lastEdit.by?.profile?.name} madeAt={lastEdit.madeAt} />
    </BubbleContainer>
  );
}
