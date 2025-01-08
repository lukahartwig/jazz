import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import type { PasskeyAuthState } from "./useRNPasskeyAuth.ts";

export function PasskeyAuthBasicUI({ state }: { state: PasskeyAuthState }) {
  const [username, setUsername] = useState("");

  if (state.state === "loading") {
    return <Text>Loading...</Text>;
  }
  if (state.state === "signedIn") {
    return (
      <View>
        <Text>You are signed in!</Text>
        <Button title="Log out" onPress={state.logOut} />
      </View>
    );
  }
  if (state.state === "ready") {
    return (
      <View style={styles.container}>
        {state.errors.length > 0 && (
          <View>
            {state.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                {error}
              </Text>
            ))}
          </View>
        )}
        <Text style={styles.title}>Sign up with passkey</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <Button
          title="Sign Up"
          onPress={() => state.signUp(username)}
          disabled={!username.trim()}
        />
        <View style={{ marginVertical: 20 }} />
        <Button title="Log In with passkey" onPress={() => state.logIn()} />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
  },
  errorText: {
    color: "red",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 8,
  },
});
