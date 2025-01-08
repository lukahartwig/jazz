import {
  PasskeyAuthBasicUI,
  PasskeyWebView,
  useRNPasskeyAuth,
} from "jazz-react-native";
import React, { useRef } from "react";
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Jazz, useAccount, useCoState } from "./jazz";
import { Chat, Message } from "./schema";
// import { ExpoSecureStoreAdapter } from 'jazz-react-native';

function ChatScreen() {
  // const [text, setText] = React.useState('');
  // const account = useAccount();
  // const [chat] = useCoState(() => new Chat());

  // const sendMessage = () => {
  //   if (!text.trim()) return;
  //   const message = new Message();
  //   message.text = text;
  //   chat.push(message);
  //   setText('');
  // };

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.messages}>
        {chat.map((message, index) => (
          <View key={index} style={styles.message}>
            <Text>{message.text}</Text>
          </View>
        ))}
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View> */}
      <View>
        <Text>Chat</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const { authMethod, authState, webViewRef } = useRNPasskeyAuth({
    appName: "Chat RN Passkey",
    appHostname: "chat-rn-passkey.example.com",
  });

  return (
    <>
      <Jazz.Provider auth={authMethod} peer="wss://cloud.jazz.tools">
        {authState.state === "signedIn" ? (
          <ChatScreen />
        ) : (
          <SafeAreaView style={styles.container}>
            <PasskeyAuthBasicUI state={authState} />
          </SafeAreaView>
        )}
      </Jazz.Provider>

      <PasskeyWebView ref={webViewRef} onMessage={() => {}} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messages: {
    flex: 1,
    padding: 10,
  },
  message: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
});
