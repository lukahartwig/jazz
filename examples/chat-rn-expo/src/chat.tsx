import clsx from "clsx";
import * as Clipboard from "expo-clipboard";
import { Group, ID, Loaded, Profile } from "jazz-tools";
import { useEffect, useState } from "react";
import React, {
  Button,
  FlatList,
  KeyboardAvoidingView,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

import { useAccount, useCoState } from "jazz-expo";
import { Chat, Message } from "./schema";

export default function ChatScreen({ navigation }: { navigation: any }) {
  const { me, logOut } = useAccount();
  const [chatId, setChatId] = useState<string>();
  const [chatIdInput, setChatIdInput] = useState<string>();
  const loadedChat = useCoState(Chat, chatId, { resolve: { $each: true } });
  const [message, setMessage] = useState("");
  const profile = useCoState(Profile, me?._refs.profile?.id, {});

  function handleLogOut() {
    setChatId(undefined);
    logOut();
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={handleLogOut} title="Logout" />,
      headerLeft: () =>
        loadedChat ? (
          <Button
            onPress={() => {
              if (loadedChat?.id) {
                Clipboard.setStringAsync(
                  `https://chat.jazz.tools/#/chat/${loadedChat.id}`,
                );
                Alert.alert("Copied to clipboard", `Chat ID: ${loadedChat.id}`);
              }
            }}
            title="Share"
          />
        ) : null,
    });
  }, [navigation, loadedChat]);

  const createChat = () => {
    const group = Group.create(me ? { owner: me } : undefined);
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    setChatId(chat.id);
  };

  const joinChat = () => {
    if (chatIdInput) {
      setChatId(chatIdInput);
    } else {
      Alert.alert("Error", "Chat ID cannot be empty.");
    }
  };

  const sendMessage = () => {
    if (!loadedChat) return;
    if (message.trim()) {
      loadedChat.push(
        Message.create({ text: message }, { owner: loadedChat?._owner }),
      );
      setMessage("");
    }
  };

  const renderMessageItem = ({ item }: { item: Loaded<typeof Message> }) => {
    const isMe = item._edits?.text?.by?.isMe;
    return (
      <View
        className={clsx(
          `rounded-lg p-1 px-1.5 max-w-[80%] `,

          isMe ? `bg-gray-200 self-end text-right` : `bg-gray-300 self-start `,
        )}
      >
        {!isMe ? (
          <Text
            className={clsx(
              `text-xs text-gray-500`,
              isMe ? "text-right" : "text-left",
            )}
          >
            {item?._edits?.text?.by?.profile?.name}
          </Text>
        ) : null}
        <View
          className={clsx(
            "flex relative items-end justify-between",
            isMe ? "flex-row" : "flex-row",
          )}
        >
          <Text className={clsx(`text-black text-md max-w-[85%]`)}>
            {item.text}
          </Text>
          <Text
            className={clsx(
              "text-[10px] text-gray-500 text-right ml-2",
              !isMe ? "mt-2" : "mt-1",
            )}
          >
            {item?._edits?.text?.madeAt?.getHours().toString().padStart(2, "0")}
            :
            {item?._edits?.text?.madeAt
              ?.getMinutes()
              .toString()
              .padStart(2, "0")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex flex-col h-full">
      {!loadedChat ? (
        <View className="flex flex-col h-full items-center justify-center">
          <Text className="text-m font-bold mb-6">Username</Text>
          <TextInput
            className="rounded h-12 p-2 mb-12 w-40 border border-gray-200 block"
            value={profile?.name ?? ""}
            onChangeText={(value) => {
              if (profile) {
                profile.name = value;
              }
            }}
            textAlignVertical="center"
            onSubmitEditing={sendMessage}
            testID="username-input"
          />
          <TouchableOpacity
            onPress={createChat}
            className="bg-blue-500 p-4 rounded-md"
          >
            <Text className="text-white font-semibold">Start new chat</Text>
          </TouchableOpacity>
          <Text className="text-m font-bold mt-6">Join existing chat</Text>
          <TextInput
            className="rounded h-12 p-2 m-2 mt-4 w-80 border border-gray-200 block"
            placeholder="Chat ID"
            value={chatIdInput ?? ""}
            onChangeText={(value) => {
              setChatIdInput(value);
            }}
            textAlignVertical="center"
            onSubmitEditing={() => {
              if (chatIdInput) {
                setChatId(chatIdInput);
              }
            }}
            testID="chat-id-input"
          />
          <TouchableOpacity
            onPress={joinChat}
            className="bg-green-500 p-4 rounded-md"
          >
            <Text className="text-white font-semibold">Join chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            contentContainerStyle={{
              flexGrow: 1,
              gap: 6,
              padding: 8,
            }}
            className="flex"
            data={loadedChat}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
          />

          <KeyboardAvoidingView
            keyboardVerticalOffset={110}
            behavior="padding"
            className="p-3 bg-white border-t border-gray-300"
          >
            <SafeAreaView className="flex flex-row items-center gap-2">
              <TextInput
                className="rounded-full h-8 py-0 px-2  border border-gray-200 block flex-1"
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                textAlignVertical="center"
                onSubmitEditing={sendMessage}
                testID="message-input"
              />
              <TouchableOpacity
                onPress={sendMessage}
                className="bg-gray-300 text-white rounded-full h-8 w-8 items-center justify-center"
                testID="send-button"
              >
                <Text>↑</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
}
