# Jazz React Native Storage with op-sqlite

This package provides a pre-configured Jazz Provider with @op-engineering/op-sqlite storage for React Native applications. It offers a batteries-included approach to using Jazz with op-sqlite, providing better performance compared to Expo SQLite.

## Features

- Pre-configured JazzProvider with op-sqlite storage
- Seamless integration with Jazz React Native
- Built-in state management for authentication
- Automatic handling of development mode peculiarities
- Clean session management and cleanup
- High-performance SQLite operations
- Support for both synchronous and asynchronous queries

## Installation

```bash
pnpm install jazz-react-native-storage-op-sqlite @op-engineering/op-sqlite
```

## Usage

This package provides a simplified way to use Jazz with op-sqlite storage. Simply import and use the pre-configured `JazzProvider`:

```typescript
import { JazzProvider } from 'jazz-react-native-storage-op-sqlite';

function App() {
  return (
    <JazzProvider 
      auth={auth}
      peer="wss://cloud.jazz.tools/?key=you@example.com"
      AccountSchema={MyAppAccount}
    >
      <YourApp />
    </JazzProvider>
  );
}
```

The provider automatically:
- Sets up op-sqlite storage
- Manages authentication state
- Handles session lifecycle
- Provides proper cleanup in development mode
- Optimizes database operations for better performance

### Props

- `auth`: Authentication configuration
- `peer`: WebSocket peer URL for sync
- `AccountSchema`: (Optional) Custom account schema
- `CryptoProvider`: (Optional) Custom crypto provider
- `children`: React components that need access to Jazz

### Guest Mode

You can also use the provider in guest mode:

```typescript
<JazzProvider 
  auth="guest"
  peer="wss://cloud.jazz.tools/?key=guest"
>
  <YourApp />
</JazzProvider>
```

## Under the Hood

This package:
1. Uses `cojson-storage-rn-op-sqlite-adapter` for high-performance SQLite operations
2. Integrates with `jazz-react-native` for React Native specific features
3. Provides proper context management and cleanup
4. Handles development mode double-rendering gracefully
5. Optimizes database operations using op-sqlite's capabilities

## Platform-Specific Details

The adapter automatically handles platform-specific database paths:
- iOS: Uses IOS_LIBRARY_PATH
- Android: Uses ANDROID_DATABASE_PATH

## Requirements

- React Native
- @op-engineering/op-sqlite

## License

MIT License - see LICENSE.txt for details
