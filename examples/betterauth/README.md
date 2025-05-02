# Better Auth Integration Example

This example demonstrates using Jazz with Better Auth and Next.js.

## Getting started

To run this example, you may either:
* Clone the Jazz monorepo and run this example from within.
* Create a new Jazz project using this example as a template, and run that new project.


### Using this example as a template

1. Create a new Jazz project, and use this example as a template.
```sh
npx create-jazz-app@latest betterauth-app --example betterauth
```
2. Navigate to the new project and start the development server.
```sh
cd betterauth-app
npm run dev
```

### Using the monorepo

This requires `pnpm` to be installed; see [https://pnpm.io/installation](https://pnpm.io/installation).

1. Clone the `jazz` repository.
```sh
git clone https://github.com/garden-co/jazz.git
```
2. Install dependencies.
```sh
cd jazz
pnpm install
```
3. Navigate to the example and start the development server.
```sh
cd examples/betterauth
pnpm dev
```

The example should be running at [http://localhost:3000](http://localhost:3000) by default.
