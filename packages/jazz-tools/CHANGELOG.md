# jazz-tools

## 0.14.7

### Patch Changes

- 365b0ea: reduce the z exported APIs to the ones we support and fix compatible types

## 0.14.6

### Patch Changes

- 9d6d9fe: Fixes co.fileStream create and createFromBlob types
- 9d6d9fe: Fixes init type for CoList, CoFeed and CoRecord to accept optional partially loaded values

## 0.14.5

### Patch Changes

- 91cbb2f: Fix CoMap.create with optional types
- 20b3d88: Add co.loaded utility

## 0.14.4

### Patch Changes

- 011af55: Support z.enum in the schema definitions

## 0.14.2

### Patch Changes

- 3d1027f: Make possible to extend a group without having access to it
- c240eed: Fix custom AccountSchema support in testing utils

## 0.14.1

### Patch Changes

- cdfc105: Make the profile access on Group members trigger updates correctly
- Updated dependencies [c8b33ad]
  - cojson@0.14.1

## 0.14.0

### Minor Changes

- 5835ed1: Switch to using Zod to define CoValue schemas

### Patch Changes

- Updated dependencies [5835ed1]
  - cojson@0.14.0

## 0.13.31

### Patch Changes

- e5b170f: Add $onError option to resolve, to be able to catch errors inside of the deep loading
- Updated dependencies [d63716a]
- Updated dependencies [d5edad7]
  - cojson@0.13.31

## 0.13.30

### Patch Changes

- Updated dependencies [07dd2c5]
  - cojson@0.13.30

## 0.13.29

### Patch Changes

- Updated dependencies [eef1a5d]
- Updated dependencies [191ae38]
- Updated dependencies [daee7b9]
  - cojson@0.13.29

## 0.13.28

### Patch Changes

- Updated dependencies [e7ccb2c]
  - cojson@0.13.28

## 0.13.27

### Patch Changes

- Updated dependencies [6357052]
  - cojson@0.13.27

## 0.13.26

### Patch Changes

- ff846d9: Fix loading accounts with the new subscription engine

## 0.13.25

### Patch Changes

- Updated dependencies [a846e07]
  - cojson@0.13.25

## 0.13.23

### Patch Changes

- 02a240c: Add getMetadata to fileStream to easily get file metadata
- Updated dependencies [6b781cf]
  - cojson@0.13.23

## 0.13.21

### Patch Changes

- Updated dependencies [e14e61f]
  - cojson@0.13.21

## 0.13.20

### Patch Changes

- 439f0fe: Adds creation owner and consume-as-string shorthands to `CoPlainText`
- Updated dependencies [adfc9a6]
- Updated dependencies [1389207]
- Updated dependencies [d6e143e]
- Updated dependencies [3e6229d]
  - cojson@0.13.20

## 0.13.19

### Patch Changes

- 80530a4: Improve error management for autoloaded values and fix autoloading on $each resolve

## 0.13.18

### Patch Changes

- 761759c: Full rewrite of the subscription engine, bringing more stability and better performance.
- Updated dependencies [9089252]
- Updated dependencies [b470f63]
- Updated dependencies [66373ba]
- Updated dependencies [f24cad1]
  - cojson@0.13.18

## 0.13.17

### Patch Changes

- Updated dependencies [9fb98e2]
- Updated dependencies [0b89fad]
  - cojson@0.13.17

## 0.13.16

### Patch Changes

- Updated dependencies [c6fb8dc]
  - cojson@0.13.16

## 0.13.15

### Patch Changes

- Updated dependencies [c712ef2]
  - cojson@0.13.15

## 0.13.14

### Patch Changes

- Updated dependencies [5c2c7d4]
  - cojson@0.13.14

## 0.13.13

### Patch Changes

- Updated dependencies [ec9cb40]
  - cojson@0.13.13

## 0.13.12

### Patch Changes

- 4547525: Skip non-schema related keys when calling CoMap.toJSON
- Updated dependencies [65719f2]
  - cojson@0.13.12

## 0.13.11

### Patch Changes

- 17273a6: CoRichText released
- Updated dependencies [17273a6]
- Updated dependencies [3396ed4]
- Updated dependencies [267ea4c]
  - cojson@0.13.11

## 0.13.10

### Patch Changes

- Updated dependencies [f837cfe]
  - cojson@0.13.10

## 0.13.9

### Patch Changes

- a6cf01f: Handle null values on CoList when using $each: true

## 0.13.7

### Patch Changes

- bc3d7bb: Allow to assign the writeOnly role to everyone
- Updated dependencies [bc3d7bb]
- Updated dependencies [4e9aae1]
- Updated dependencies [21c935c]
- Updated dependencies [aa1c80e]
- Updated dependencies [13074be]
  - cojson@0.13.7

## 0.13.5

### Patch Changes

- fe6f561: Gracefully handle unavailable messages error in the Inbox
- Updated dependencies [e090b39]
  - cojson@0.13.5

## 0.13.4

### Patch Changes

- 3129982: Add logOutReplacement hook to replace the Jazz logout function with a custom one

## 0.13.3

### Patch Changes

- 12f8bfa: Log permission errors when loading or subscribing to values
- bd57177: Handle null properties in the CoMap deep loading

## 0.13.2

### Patch Changes

- Updated dependencies [c551839]
  - cojson@0.13.2

## 0.13.0

### Patch Changes

- afd1374: Accept null as initial value for createCoValueObservable
- Updated dependencies [a013538]
- Updated dependencies [bce3bcc]
  - cojson@0.13.0

## 0.12.2

### Patch Changes

- Updated dependencies [c2f4827]
  - cojson@0.12.2

## 0.12.1

### Patch Changes

- Updated dependencies [5a00fe0]
  - cojson@0.12.1

## 0.12.0

### Minor Changes

- 01523dc: Check CoValue access permissions when loading
- 4ea87dc: Implement new API for deep loading
- 1e6da19: The .load function now returns `null` on error

### Patch Changes

- b6c6a0a: Make the linkAccounts test utility wait for the accounts coValues to be synced
- Updated dependencies [01523dc]
- Updated dependencies [01523dc]
  - cojson@0.12.0

## 0.11.8

### Patch Changes

- Updated dependencies [6c86c4f]
- Updated dependencies [9d0c9dc]
  - cojson@0.11.8

## 0.11.7

### Patch Changes

- a140f55: Bugfix: Trigger a single update when loading a locally available list of items
- 2b0d1b0: Export CoFeedEntry type
- Updated dependencies [2b94bc8]
- Updated dependencies [2957362]
  - cojson@0.11.7

## 0.11.6

### Patch Changes

- e7c85b7: Add targetWidth to highestResAvailable to add a way to fetch the next size up
- Updated dependencies [8ed144e]
  - cojson@0.11.6

## 0.11.5

### Patch Changes

- Updated dependencies [60f5b3f]
  - cojson@0.11.5

## 0.11.4

### Patch Changes

- 57a3dbe: Throw when assigning invalid values to ref fields
- a717754: Use RegisteredAccount types for `by` props
- a91f343: Fixes coList.splice to handle insertions at start of list
- Updated dependencies [7f036c1]
  - cojson@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies [68b0242]
  - cojson@0.11.3

## 0.11.2

### Patch Changes

- 6892dc6: Adds `applyDiff` to `CoList`

## 0.11.0

### Minor Changes

- b9d194a: Make members return inherited members
  Added getRoleOf method to Account and Group
  Added canRead, canWrite, canAdmin methods to Account so simplify permissions checks
- 34cbdc3: Added revokeExtend method to Group
- f039e8f: Remove co.members and use RegisteredAccount and the configured AccountSchema to setup the members Account class. Remove everyone from Group.members results
- e22de9f: Fix profile migrations

### Patch Changes

- 6a96d8b: Add getParentGroups API to Group
- a35249a: Fix CoMap.toJSON() with encoded fields
- a4713df: Moving to the d.ts files for the exported type definitions
- Updated dependencies [b9d194a]
- Updated dependencies [a4713df]
- Updated dependencies [e22de9f]
- Updated dependencies [34cbdc3]
- Updated dependencies [0f67e0a]
  - cojson@0.11.0

## 0.10.15

### Patch Changes

- 2f99de0: Avoid race conditions on context creation and run the anonymous migration only when the hook is provided
- Updated dependencies [f86e278]
  - cojson@0.10.15

## 0.10.14

### Patch Changes

- 75211e3: Fixes invalid authentication state when logging out after signUp

## 0.10.13

### Patch Changes

- 07feedd: Add registerNewUser and generateRandomPassphrase methods to PasskeyAuth and accept the username param on the signUp function

## 0.10.12

### Patch Changes

- 4612e05: Fix type inference on `useCoState`

## 0.10.8

### Patch Changes

- 2fb6428: Allow explicit keys when loading values from a CoMap.Record and throw when a required ref is undefined
- Updated dependencies [153dc99]
  - cojson@0.10.8

## 0.10.7

### Patch Changes

- 1136d9b: Fixed isAuthenticated out-of-sync with the account state during the logOut and authenticate flows
- 0eed228: Fixes clerk auth flow
- Updated dependencies [0f83320]
- Updated dependencies [012022d]
  - cojson@0.10.7

## 0.10.6

### Patch Changes

- ada802b: Fix Clerk credentials migration
- Updated dependencies [5c76e37]
  - cojson@0.10.6

## 0.10.5

### Patch Changes

- 59ff77e: Critical fix: move the Account migration code execution in the right place to ensure that the changes applied to the right Jazz node.

## 0.10.4

### Patch Changes

- Updated dependencies [1af6072]
  - cojson@0.10.4

## 0.10.3

### Patch Changes

- d8582fc: Fixes coField.optional.Date throwing when assigned undefined

## 0.10.2

### Patch Changes

- Updated dependencies [cae3a9e]
  - cojson@0.10.2

## 0.10.1

### Patch Changes

- 5a63cba: Not re-export Crypto providers from cojson. Removed the separated bundle for React Native.
- Updated dependencies [5a63cba]
  - cojson@0.10.1

## 0.10.0

### Minor Changes

- 498954f: Introducing the new auth system!
- dd03464: Group.addMember and Group.removeMember are not chainable anymore.
  Group.removeMember now returns the internal promise.
- b426342: Return null when a coValue is not found

### Patch Changes

- d42c2aa: Make ensureLoaded throw when the resolved value is undefined
- Updated dependencies [b426342]
- Updated dependencies [498954f]
- Updated dependencies [8217981]
- Updated dependencies [ac3d9fa]
- Updated dependencies [610543c]
  - cojson@0.10.0

## 0.9.23

### Patch Changes

- Updated dependencies [70c9a5d]
  - cojson@0.9.23

## 0.9.21

### Patch Changes

- 1be017d: Account.isMe now indicates whether an account is the currently active account. To check if an account is the owner of the local node use isLocalNodeOwner instead.

## 0.9.20

### Patch Changes

- b01cc1f: Switches from symbols to prefixes strings for private properties

## 0.9.19

### Patch Changes

- Updated dependencies [6ad0a9f]
  - cojson@0.9.19

## 0.9.18

### Patch Changes

- Updated dependencies [8898b10]
  - cojson@0.9.18

## 0.9.17

### Patch Changes

- c2ca1fe: Add cross-platform invite API
- 1227047: Improve typescript types for group.addMember

## 0.9.16

### Patch Changes

- 24b3b6a: Extract friendly user name for profile creation when authenticating using Clerk with a regular email address.
  Email passed to creationProps when using Clerk auth
  Clear stored Clerk credentials on logout

## 0.9.15

### Patch Changes

- 7491711: Testing: correctly set the globalMe before the migration when calling createJazzTestAccount

## 0.9.14

### Patch Changes

- 3df93cc: Add API to setup a test sync in the test environment

## 0.9.13

### Patch Changes

- Updated dependencies [8d29e50]
  - cojson@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies [15d4b2a]
  - cojson@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies [efbf3d8]
- Updated dependencies [5863bad]
  - cojson@0.9.11

## 0.9.10

### Patch Changes

- 5e83864: Improve error management on initial auth, fixed an infinite loop when migration fails
- Updated dependencies [4aa377d]
  - cojson@0.9.10

## 0.9.9

### Patch Changes

- 8eb9247: Add CoRichText support
- Updated dependencies [8eb9247]
  - cojson@0.9.9

## 0.9.8

### Patch Changes

- d1d773b: Make possible to call the load/subscribe/create API without passing me

## 0.9.1

### Patch Changes

- 1b71969: Add Onboarding auth to handle users onboarding without an auth screen

## 0.9.0

### Patch Changes

- 8eda792: Optimize the subscribe to resolve the CoValues stored in memory synchronously
- Updated dependencies [8eda792]
- Updated dependencies [1ef3226]
  - cojson@0.9.0

## 0.8.51

### Patch Changes

- dc62b95: Return field name on \_edits
- 1de26f8: Simplify the .create calls by accepting directly "Account | Group" as second param

## 0.8.50

### Patch Changes

- Updated dependencies [43378ef]
  - cojson@0.8.50

## 0.8.49

### Patch Changes

- Updated dependencies [25dfd90]
  - cojson@0.8.49

## 0.8.48

### Patch Changes

- 635e824: fix loading of CoMaps with an empty schema
- 0a85982: Remove the requirement of calling super.migrate when defining the account migration
- Updated dependencies [10ea733]
  - cojson@0.8.48

## 0.8.45

### Patch Changes

- fa41f8e: Add a bundle step to not expose the circular deps to the lib consumers
- 88d7d9a: Add Inbox a new experimental API to simplfy the initial handshake between accounts
- 60e35ea: Reduce the amount of circular deps
- Updated dependencies [6f0bd7f]
- Updated dependencies [fca6a0b]
- Updated dependencies [88d7d9a]
  - cojson@0.8.45

## 0.8.44

### Patch Changes

- Updated dependencies [5d20c81]
  - cojson@0.8.44

## 0.8.41

### Patch Changes

- Updated dependencies [3252502]
- Updated dependencies [6370348]
- Updated dependencies [ac216b9]
  - cojson@0.8.41

## 0.8.39

### Patch Changes

- 249eecb: Added new APIs to wait for CoValue sync
- Updated dependencies [249eecb]
- Updated dependencies [3121551]
  - cojson@0.8.39

## 0.8.38

### Patch Changes

- Updated dependencies [b00ee91]
- Updated dependencies [f488c09]
  - cojson@0.8.38

## 0.8.37

### Patch Changes

- Updated dependencies [3d9f12e]
  - cojson@0.8.37

## 0.8.36

### Patch Changes

- 441fe27: Optimise large record-like CoMaps for access of latest value
- Updated dependencies [441fe27]
  - cojson@0.8.36

## 0.8.35

### Patch Changes

- 8b87117: Implement Group Inheritance
- Updated dependencies [3f15a23]
- Updated dependencies [46f2ab8]
- Updated dependencies [8b87117]
- Updated dependencies [a6b6ccf]
  - cojson@0.8.35

## 0.8.34

### Patch Changes

- Updated dependencies [e4f110f]
  - cojson@0.8.34

## 0.8.32

### Patch Changes

- df42b2b: Allow getting all edits for a specific key in a CoMap
- Updated dependencies [df42b2b]
  - cojson@0.8.32

## 0.8.31

### Patch Changes

- Updated dependencies [e511d6d]
  - cojson@0.8.31

## 0.8.30

### Patch Changes

- Updated dependencies [0a2fae3]
- Updated dependencies [99cda2f]
  - cojson@0.8.30

## 0.8.29

### Patch Changes

- Updated dependencies [dcc9c2e]
- Updated dependencies [699553f]
  - cojson@0.8.29

## 0.8.28

### Patch Changes

- Updated dependencies [605734c]
  - cojson@0.8.28

## 0.8.27

### Patch Changes

- Updated dependencies [75fdff4]
  - cojson@0.8.27

## 0.8.23

### Patch Changes

- d348c2d: Rename BinaryCoStream to FileStream
- 6902b5b: Rename CoStream to CoFeed
- 1a0cd3d: Added SchemaUnion.Of(), a new API that lets you express unions of other Schema definitions (often different subclasses of a parent Schema class) that are correctly narrowed in TypeScript and correctly instantiated at runtime based on a discriminating field in the raw loaded CoValue.
- Updated dependencies [6f745be]
- Updated dependencies [124bf67]
  - cojson@0.8.23

## 0.8.21

### Patch Changes

- 149ca97: changed jazz-tools TS target to ES2021
- Updated dependencies [0f30eea]
  - cojson@0.8.21

## 0.8.19

### Patch Changes

- Updated dependencies [9c2aadb]
  - cojson@0.8.19

## 0.8.18

### Patch Changes

- Updated dependencies [d4319d8]
  - cojson@0.8.18

## 0.8.17

### Patch Changes

- Updated dependencies [d433cf4]
  - cojson@0.8.17

## 0.8.16

### Patch Changes

- Updated dependencies [b934fab]
  - cojson@0.8.16

## 0.8.15

### Patch Changes

- cce679b: Export `type Credentials` and mark `AuthResult.saveCredentials` as optional and run if available

## 0.8.14

### Patch Changes

- 36273b3: Cache other usages of Account.fromRaw

## 0.8.13

### Patch Changes

- fd011d7: Add a cache layer on the loadedAs account reads

## 0.8.12

### Patch Changes

- Updated dependencies [6ed75eb]
  - cojson@0.8.12

## 0.8.11

### Patch Changes

- Updated dependencies [1ed4ab5]
  - cojson@0.8.11

## 0.8.5

### Patch Changes

- c3f4e6b: Fix order of exports fields in package.json
- d9152ed: Allow interface types as generic argument in coField.json
- Updated dependencies [c3f4e6b]
- Updated dependencies [d9152ed]
  - cojson@0.8.5

## 0.8.3

### Patch Changes

- Updated dependencies
  - cojson@0.8.3

## 0.8.2

### Patch Changes

- a075f90: Fixed cursor reset when interacting with text inputs

## 0.8.1

### Patch Changes

- Expose randomSessionProvider and fix jazz-run

## 0.8.0

### Minor Changes

- bcec3be: Implement new top-level context creation and auth method API

### Patch Changes

- ad40b88: First sketch of API for creating and finding unique CoValues
- 23369dc: Re-add logout functionality to AuthMethods
- c2b62a0: Make anonymous auth work better
- 1a979b6: Implement guest auth without account
- Updated dependencies [6a147c2]
- Updated dependencies [ad40b88]
  - cojson@0.8.0

## 0.7.35-guest-auth.6

### Patch Changes

- Re-add logout functionality to AuthMethods

## 0.7.35

### Patch Changes

- 49a8b54: Fix on CoMapInit to not allow null values on required refs
- 6f80282: fix: handle null values for coField.refs
- 35bbcd9: Fix loadAsBlob resolving too early
- f350e90: Added a priority system for the sync messages
- Updated dependencies [35bbcd9]
- Updated dependencies [f350e90]
  - cojson@0.7.35

## 0.7.34

### Patch Changes

- Updated dependencies [5d91f9f]
- Updated dependencies [5094e6d]
- Updated dependencies [b09589b]
- Updated dependencies [2c3a40c]
- Updated dependencies [4e16575]
- Updated dependencies [ea882ab]
  - cojson@0.7.34

## 0.7.34-neverthrow.8

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.8

## 0.7.34-neverthrow.7

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.7

## 0.7.34-neverthrow.4

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.4

## 0.7.34-neverthrow.3

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.3

## 0.7.34-neverthrow.1

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.1

## 0.7.34-neverthrow.0

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.0

## 0.7.33

### Patch Changes

- Updated dependencies [b297c93]
- Updated dependencies [3bf5127]
- Updated dependencies [a8b74ff]
- Updated dependencies [db53161]
  - cojson@0.7.33

## 0.7.33-hotfixes.5

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.5

## 0.7.33-hotfixes.4

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.4

## 0.7.33-hotfixes.3

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.3

## 0.7.33-hotfixes.0

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.0

## 0.7.32

### Patch Changes

- Adapt type of applyDiff to make CoMaps fully subclassable again

## 0.7.31

### Patch Changes

- Updated dependencies
  - cojson@0.7.31

## 0.7.29

### Patch Changes

- Updated dependencies
  - cojson@0.7.29

## 0.7.28

### Patch Changes

- Updated dependencies
  - cojson@0.7.28

## 0.7.26

### Patch Changes

- Remove Effect from jazz/cojson internals
- Updated dependencies
  - cojson@0.7.26

## 0.7.25

### Patch Changes

- Implement applyDiff on CoMap to only update changed fields

## 0.7.24

### Patch Changes

- Remove effectful API for loading/subscribing

## 0.7.23

### Patch Changes

- Mostly complete OPFS implementation (single-tab only)
- Updated dependencies
  - cojson@0.7.23

## 0.7.21

### Patch Changes

- Fix another bug in CoMap 'has' proxy trap

## 0.7.20

### Patch Changes

- Fix bug in CoMap 'has' trap

## 0.7.19

### Patch Changes

- Add support for "in" operator in CoMaps

## 0.7.18

### Patch Changes

- Updated dependencies
  - cojson@0.7.18

## 0.7.17

### Patch Changes

- Updated dependencies
  - cojson@0.7.17

## 0.7.16

### Patch Changes

- Fix: allow null in encoded fields

## 0.7.14

### Patch Changes

- Use Effect Queues and Streams instead of custom queue implementation
- Updated dependencies
  - cojson@0.7.14

## 0.7.13

### Patch Changes

- Fix CoList.toJSON()

## 0.7.12

### Patch Changes

- Fix: toJSON infinitely recurses on circular CoValue structures

## 0.7.11

### Patch Changes

- Updated dependencies
  - cojson@0.7.11
  - cojson-transport-nodejs-ws@0.7.11

## 0.7.10

### Patch Changes

- Updated dependencies
  - cojson@0.7.10
  - cojson-transport-nodejs-ws@0.7.10

## 0.7.9

### Patch Changes

- Updated dependencies
  - cojson@0.7.9
  - cojson-transport-nodejs-ws@0.7.9

## 0.7.8

### Patch Changes

- Fix CoMaps not initialising properly when passing too many init options

## 0.7.6

### Patch Changes

- Provide way to create accounts as another account

## 0.7.3

### Patch Changes

- Clean up loading & subscription API

## 0.7.1

### Patch Changes

- Add runtime option for optional refs

## 0.7.0

### Minor Changes

- e299c3e: New simplified API

### Patch Changes

- 8636319: Fix infinite recursion in subscriptionScope
- 8636319: Fix type of init param for CoMap.create
- 1a35307: Implement first devtools formatters
- 96c494f: Implement profile visibility based on groups & new migration signature
- 59c18c3: CoMap fix
- 19f52b7: Fixed bug with newRandomSessionID being called before crypto was ready
- 8636319: Implement deep loading, simplify API
- 19004b4: Add .all to CoStreamEntry
- a78f168: Make Account -> Profile a lazy ref schema
- 52675c9: Fix CoList.splice / RawCoList.append
- 129e2c1: More precise imports from @effect/schema
- 1cfa279: More superclass-compatible CoMaps
- 704af7d: Add maxWidth option for loading images
- 460478f: Use effect 3.0
- 6b0418f: Fix image resolution loading
- ed5643a: Fix CoMap \_refs for co.items
- bde684f: CoValue casting & auto-subbing \_owner
- c4151fc: Support stricter TS lint rules
- 63374cc: Relax types of CoMap.\_schema
- 01ac646: Make CoMaps even more subclassable
- a5e68a4: Make refs type more precise
- 952982e: Consistent proxy based API
- 1a35307: Add ability to declare minimum required data in subscribe & Improve property access tracing
- 5fa277c: Fix CoMap.Record.toJSON()
- 60d5ca2: Introduce jazz-tools CLI
- 21771c4: Reintroduce changes from main
- 77c2b56: Get rid of self generics, new create syntax
- 63374cc: Fix schema of Account & Group
- d2e03ff: Fix variance of ID.\_\_type
- 354bdcd: Even friendlier for subclassing CoMap
- 60d5ca2: Clean up exports
- 69ac514: Use effect schema much less
- f8a5c46: Fix CoStream types
- f0f6f1b: Clean up API more & re-add jazz-nodejs
- e5eed5b: Make refs on list more precise
- 1a44f87: Refactoring
- 627d895: Get rid of Co namespace
- 1200aae: Cache CoValue proxies
- 63374cc: Make sure delete on CoMaps deletes keys
- ece35b3: Make fast-check a direct dependency to help dev time resolution
- 38d4410: CoMap fixes and improvements
- 85d2b62: More subclass-friendly types in CoMap
- fd86c11: Extract jazz cli into jazz-run package
- 52675c9: Fix Costream[...].all
- Updated dependencies [1a35307]
- Updated dependencies [96c494f]
- Updated dependencies [19f52b7]
- Updated dependencies [d8fe2b1]
- Updated dependencies [1200aae]
- Updated dependencies [52675c9]
- Updated dependencies [1a35307]
- Updated dependencies [e299c3e]
- Updated dependencies [bf0f8ec]
- Updated dependencies [c4151fc]
- Updated dependencies [8636319]
- Updated dependencies [952982e]
- Updated dependencies [21771c4]
- Updated dependencies [69ac514]
- Updated dependencies [f0f6f1b]
- Updated dependencies [1a44f87]
- Updated dependencies [627d895]
- Updated dependencies [63374cc]
- Updated dependencies [a423eee]
  - cojson@0.7.0
  - cojson-transport-nodejs-ws@0.7.0

## 0.7.0-alpha.42

### Patch Changes

- Fixed bug with newRandomSessionID being called before crypto was ready
- Updated dependencies
  - cojson@0.7.0-alpha.42
  - cojson-transport-nodejs-ws@0.7.0-alpha.42

## 0.7.0-alpha.41

### Patch Changes

- Updated dependencies
  - cojson-transport-nodejs-ws@0.7.0-alpha.41

## 0.7.0-alpha.39

### Patch Changes

- Updated dependencies
  - cojson@0.7.0-alpha.39
  - cojson-transport-nodejs-ws@0.7.0-alpha.39

## 0.7.0-alpha.38

### Patch Changes

- Fix infinite recursion in subscriptionScope
- Fix type of init param for CoMap.create
- Implement deep loading, simplify API
- Updated dependencies
  - cojson@0.7.0-alpha.38
  - cojson-transport-nodejs-ws@0.7.0-alpha.38

## 0.7.0-alpha.37

### Patch Changes

- Updated dependencies
  - cojson@0.7.0-alpha.37
  - cojson-transport-nodejs-ws@0.7.0-alpha.37

## 0.7.0-alpha.36

### Patch Changes

- 1a35307: Implement first devtools formatters
- 6b0418f: Fix image resolution loading
- 1a35307: Add ability to declare minimum required data in subscribe & Improve property access tracing
- Updated dependencies [1a35307]
- Updated dependencies [1a35307]
  - cojson@0.7.0-alpha.36
  - cojson-transport-nodejs-ws@0.7.0-alpha.36

## 0.7.0-alpha.35

### Patch Changes

- Cache CoValue proxies
- Updated dependencies
  - cojson@0.7.0-alpha.35
  - cojson-transport-nodejs-ws@0.7.0-alpha.35

## 0.7.0-alpha.34

### Patch Changes

- Extract jazz cli into jazz-run package

## 0.7.0-alpha.32

### Patch Changes

- Introduce jazz-tools CLI
- Clean up exports

## 0.7.0-alpha.31

### Patch Changes

- Get rid of self generics, new create syntax

## 0.7.0-alpha.30

### Patch Changes

- CoValue casting & auto-subbing \_owner

## 0.7.0-alpha.29

### Patch Changes

- Reintroduce changes from main
- Updated dependencies
  - cojson@0.7.0-alpha.29

## 0.7.0-alpha.28

### Patch Changes

- Implement profile visibility based on groups & new migration signature
- Updated dependencies
  - cojson@0.7.0-alpha.28

## 0.7.0-alpha.27

### Patch Changes

- Fix CoList.splice / RawCoList.append
- Fix Costream[...].all
- Updated dependencies
  - cojson@0.7.0-alpha.27

## 0.7.0-alpha.26

### Patch Changes

- Fix CoMap.Record.toJSON()

## 0.7.0-alpha.25

### Patch Changes

- Make Account -> Profile a lazy ref schema

## 0.7.0-alpha.24

### Patch Changes

- Relax types of CoMap.\_schema
- Fix schema of Account & Group
- Make sure delete on CoMaps deletes keys
- Updated dependencies
  - cojson@0.7.0-alpha.24

## 0.7.0-alpha.23

### Patch Changes

- CoMap fixes and improvements

## 0.7.0-alpha.22

### Patch Changes

- Fix CoMap \_refs for co.items

## 0.7.0-alpha.21

### Patch Changes

- Add maxWidth option for loading images

## 0.7.0-alpha.20

### Patch Changes

- Make fast-check a direct dependency to help dev time resolution

## 0.7.0-alpha.19

### Patch Changes

- More precise imports from @effect/schema

## 0.7.0-alpha.17

### Patch Changes

- Use effect 3.0

## 0.7.0-alpha.16

### Patch Changes

- Make CoMaps even more subclassable

## 0.7.0-alpha.15

### Patch Changes

- More superclass-compatible CoMaps

## 0.7.0-alpha.14

### Patch Changes

- Fix CoStream types

## 0.7.0-alpha.13

### Patch Changes

- Add .all to CoStreamEntry

## 0.7.0-alpha.12

### Patch Changes

- Fix variance of ID.\_\_type

## 0.7.0-alpha.11

### Patch Changes

- Support stricter TS lint rules
- Updated dependencies
  - cojson@0.7.0-alpha.11

## 0.7.0-alpha.10

### Patch Changes

- Clean up API more & re-add jazz-nodejs
- Updated dependencies
  - cojson@0.7.0-alpha.10

## 0.7.0-alpha.9

### Patch Changes

- Even friendlier for subclassing CoMap

## 0.7.0-alpha.8

### Patch Changes

- More subclass-friendly types in CoMap

## 0.7.0-alpha.7

### Patch Changes

- Consistent proxy based API
- Updated dependencies
  - cojson@0.7.0-alpha.7

## 0.7.0-alpha.6

### Patch Changes

- CoMap fix

## 0.7.0-alpha.5

### Patch Changes

- Refactoring
- Updated dependencies
  - cojson@0.7.0-alpha.5

## 0.7.0-alpha.4

### Patch Changes

- Make refs on list more precise

## 0.7.0-alpha.3

### Patch Changes

- Make refs type more precise

## 0.7.0-alpha.2

### Patch Changes

- Get rid of Co namespace

## 0.7.0-alpha.1

### Patch Changes

- Use effect schema much less
- Updated dependencies
  - cojson@0.7.0-alpha.1

## 0.7.0-alpha.0

### Minor Changes

- New simplified API

### Patch Changes

- Updated dependencies
  - cojson@0.7.0-alpha.0

## 0.6.1

### Patch Changes

- Fix loading of accounts
- Updated dependencies
  - cojson@0.6.5

## 0.6.0

### Minor Changes

- Make addMember and removeMember take loaded Accounts instead of just IDs

### Patch Changes

- Updated dependencies
  - cojson@0.6.0

## 0.5.0

### Minor Changes

- Adding a lot of performance improvements to cojson, add a stresstest for the twit example and make that run smoother in a lot of ways.

### Patch Changes

- Updated dependencies
  - cojson@0.5.0
