# Jazz Inspector Element

A custom element that renders the Jazz Inspector component for inspecting Jazz accounts and CoValues.

## Installation

```bash
npm install jazz-inspector-element
```

## Usage

By default jazz-inspector-element relies on `Account.getMe()` to link itself to the Jazz context, so it's enough to mount the html element in a page with a loaded Jazz app:

```ts
import "jazz-inspector-element"

document.body.appendChild(document.createElement("jazz-inspector"))
```

OR

```ts
import "jazz-inspector-element" // somewhere in your app modules
```

and

```html
<jazz-inspector />
```
