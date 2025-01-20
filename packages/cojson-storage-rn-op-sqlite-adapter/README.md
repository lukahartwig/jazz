# CoJSON + opSQLite Storage Adapter for React Native

This package implements local persistence for CoJSON / Jazz (see [jazz.tools](https://jazz.tools)) using @op-engineering/op-sqlite. It provides a SQLite adapter implementation that works with op-sqlite for high-performance local data storage on React Native devices.

## Features

- Implements the SQLiteAdapter interface for CoJSON/Jazz
- Uses @op-engineering/op-sqlite for high-performance database operations
- Handles database initialization and migrations
- Provides transaction support
- Includes proper error handling and connection management
- Supports both synchronous and asynchronous operations
- Optimized for better performance compared to expo-sqlite

## Installation

```bash
pnpm install cojson-storage-rn-op-sqlite-adapter @op-engineering/op-sqlite
```

Note: This package requires `@op-engineering/op-sqlite` as a peer dependency.

## Usage

There are two ways to use this adapter:

### Option 1: Using jazz-react-native-storage-op-sqlite (Recommended)

This is the simplest approach as it provides a pre-configured JazzProvider with op-sqlite storage:

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

### Option 2: Manual Configuration with jazz-react-native

If you need more control over the adapter configuration:

1. Create and configure the adapter:

```typescript
import { OPSQLiteAdapter } from 'cojson-storage-rn-op-sqlite-adapter';

const adapter = new OPSQLiteAdapter("jazz-storage");
```

2. Pass it to JazzProvider:

```typescript
import { JazzProvider } from 'jazz-react-native';

function App() {
  return (
    <JazzProvider 
      auth={auth}
      storage={adapter}
      peer="wss://cloud.jazz.tools/?key=you@example.com"
      AccountSchema={MyAppAccount}
    >
      <YourApp />
    </JazzProvider>
  );
}
```

## API

### `OPSQLiteAdapter`

The main class that implements the SQLiteAdapter interface.

#### Constructor

```typescript
constructor(dbName: string)
```

- `dbName`: The name of the SQLite database file

#### Methods

- `initialize()`: Initializes the database and creates necessary tables
- `execute(sql: string, params?: unknown[])`: Executes an SQL statement asynchronously
- `executeSync(sql: string, params?: unknown[])`: Executes an SQL statement synchronously
- `transaction(callback: () => Promise<void>)`: Runs operations in a transaction
- `close()`: Closes the database connection
- `delete()`: Deletes the database file

## Database Schema

The adapter manages several tables:

- `transactions`: Stores transaction data
- `sessions`: Manages session information
- `coValues`: Stores CoJSON values
- `signatureAfter`: Handles signatures

## Error Handling

The adapter includes comprehensive error handling for:
- Database connection issues
- SQL constraint violations
- Syntax errors
- Transaction failures

## Platform-Specific Details

The adapter automatically handles platform-specific database paths:
- iOS: Uses IOS_LIBRARY_PATH
- Android: Uses ANDROID_DATABASE_PATH

## Requirements

- React Native
- @op-engineering/op-sqlite

## License

MIT License - see LICENSE.txt for details
