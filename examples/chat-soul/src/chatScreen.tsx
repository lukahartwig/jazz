import { createImage, useAccount, useCoState } from "jazz-react";
import { Account, CoPlainText, ID } from "jazz-tools";
import {
  AlertTriangleIcon,
  LoaderIcon,
  MicIcon,
  MicOffIcon,
  StopCircleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  TranscriptionController,
  TranscriptionState,
  TranscriptionStatus,
  collaborate,
  record,
} from "soul-dev";
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

  // Add state for recording status
  const [recordingStatus, setRecordingStatus] = useState<TranscriptionStatus>({
    state: "idle",
    message: "Ready",
  });
  const recorderRef = useRef<TranscriptionController | null>(null);

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

  // Function to start recording
  const startRecording = async () => {
    // Don't start a new recording if already recording
    if (recordingStatus.state !== "idle" && recordingStatus.state !== "error") {
      return;
    }

    // Make sure chat is available
    if (!chat) {
      setRecordingStatus({
        state: "error",
        message: "Chat not available",
        error: new Error("Chat not available"),
      });
      return;
    }

    try {
      // Start recording and store the controller
      recorderRef.current = await record({
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
        onStatusChange: (status) => {
          setRecordingStatus(status);

          // When we get an error, clean up
          if (status.state === "error") {
            recorderRef.current = null;
          }
        },
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      setRecordingStatus({
        state: "error",
        message: "Failed to start recording",
        error,
      });
      recorderRef.current = null;
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setRecordingStatus({ state: "idle", message: "Ready" });
    }
  };

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

  // Render the microphone button based on current status
  const renderMicButton = () => {
    switch (recordingStatus.state) {
      case "loading":
        return (
          <button
            className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-md"
            disabled
            title={recordingStatus.message}
          >
            <LoaderIcon size={24} className="animate-spin" strokeWidth={1.5} />
            <span className="text-xs">Loading...</span>
          </button>
        );

      case "speech_detected":
        return (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-md animate-pulse"
            title="Speech detected"
          >
            <MicIcon size={24} strokeWidth={2} className="text-green-600" />
            <span className="text-xs">Speaking...</span>
          </button>
        );

      case "listening":
        return (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-md animate-pulse"
            title="Click to stop recording"
          >
            <StopCircleIcon size={24} strokeWidth={1.5} />
            <span className="text-xs">Recording</span>
          </button>
        );

      case "processing":
        return (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-md"
            title="Processing speech..."
          >
            <LoaderIcon size={24} className="animate-spin" strokeWidth={1.5} />
            <span className="text-xs">Processing</span>
          </button>
        );

      case "error":
        return (
          <button
            onClick={startRecording}
            className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-md"
            title={recordingStatus.message}
          >
            <AlertTriangleIcon size={20} strokeWidth={1.5} />
            <span className="text-xs ml-1">Retry</span>
          </button>
        );

      case "idle":
      default:
        return (
          <button
            onClick={startRecording}
            className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Start voice recording"
          >
            <MicIcon size={24} strokeWidth={1.5} />
            <span className="text-xs ml-1">Record</span>
          </button>
        );
    }
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
          disabled={
            recordingStatus.state === "listening" ||
            recordingStatus.state === "processing"
          }
        />

        {renderMicButton()}
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
