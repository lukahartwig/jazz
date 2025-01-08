import React from "react";
import { StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

// Minimal HTML source containing WebAuthn calls
const HTML_SOURCE = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script>
    async function handlePasskeyOperation(operation, options, operationId) {
      try {
        let credential;
        if (operation === 'create') {
          credential = await navigator.credentials.create({ publicKey: options });
        } else if (operation === 'get') {
          credential = await navigator.credentials.get({ publicKey: options });
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          operationId,
          credential
        }));
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          operationId,
          error: error.message
        }));
      }
    }
  </script>
</body>
</html>
`;

type Props = {
  onMessage: (event: WebViewMessageEvent) => void;
};

type OperationCallback = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export class PasskeyWebView extends React.Component<Props> {
  private webViewRef = React.createRef<WebView>();
  private operationCallbacks = new Map<string, OperationCallback>();

  // Handle all WebView messages
  private handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      const callback = this.operationCallbacks.get(msg.operationId);

      if (callback) {
        if (msg.type === "success") {
          callback.resolve(msg.credential);
        } else if (msg.type === "error") {
          callback.reject(new Error(msg.error));
        }
        this.operationCallbacks.delete(msg.operationId);
      }

      // Forward the message to the parent component
      this.props.onMessage(event);
    } catch (e) {
      console.error("Error handling WebView message:", e);
    }
  };

  // Run the WebAuthn operation inside the WebView
  public executeOperation(operation: "create" | "get", options: unknown) {
    return new Promise<unknown>((resolve, reject) => {
      if (!this.webViewRef.current) {
        return reject(new Error("WebView reference not set"));
      }

      const operationId = Math.random().toString(36).substring(2);
      this.operationCallbacks.set(operationId, { resolve, reject });

      // We'll call the JS function defined in our HTML snippet
      const script = `
        handlePasskeyOperation("${operation}", ${JSON.stringify(options)}, "${operationId}");
        true;
      `;
      this.webViewRef.current.injectJavaScript(script);
    });
  }

  render() {
    return (
      <WebView
        ref={this.webViewRef}
        source={{ html: HTML_SOURCE }}
        onMessage={this.handleMessage}
        style={styles.hidden}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    );
  }
}

const styles = StyleSheet.create({
  hidden: {
    width: 1,
    height: 1,
    opacity: 0,
    position: "absolute",
  },
});
