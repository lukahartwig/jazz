import { BrowserContext, test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NewPostPage } from "./pages/NewPostPage";
import { PostPage } from "./pages/PostPage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("create a new post and share", async ({ page: luigiPage, browser }) => {
  const context = await browser.newContext();
  await mockAuthenticator(context);

  const marioPage = await context.newPage();
  await marioPage.goto("/");
  await luigiPage.goto("/");

  const marioLoginPage = new LoginPage(marioPage);
  await marioLoginPage.fillUsername("S. Mario");
  await marioLoginPage.signup();

  const luigiLoginPage = new LoginPage(luigiPage);
  await luigiLoginPage.fillUsername("Luigi");
  await luigiLoginPage.signup();

  const marioHomePage = new HomePage(marioPage);
  await marioHomePage.navigateToNewPost();

  const newPostPage = new NewPostPage(marioPage);

  await newPostPage.fillPetName("Yoshi");
  await newPostPage.uploadFile("./public/jazz-logo-low-res.jpg");
  await newPostPage.submit();

  const marioPostPage = new PostPage(marioPage);
  await marioPostPage.expectPetName("Yoshi");

  const invitation = await marioPostPage.getShareLink();

  await sleep(1000);
  await luigiPage.goto(invitation);

  const luigiPostPage = new PostPage(luigiPage);
  await luigiPostPage.expectPetName("Yoshi");
  await luigiPostPage.expectReactionSelectedByCurrentUser("😍", false);
  await luigiPostPage.toggleReaction("😍");
  await luigiPostPage.expectReactionSelectedByCurrentUser("😍", true);

  await marioPostPage.expectReactionByUser("😍", "Luigi");
});

async function mockAuthenticator(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(window.navigator, "credentials", {
      value: {
        ...window.navigator.credentials,
        create: async () => ({
          type: "public-key",
          id: new Uint8Array([1, 2, 3, 4]),
          rawId: new Uint8Array([1, 2, 3, 4]),
          response: {
            clientDataJSON: new Uint8Array([1]),
            attestationObject: new Uint8Array([2]),
          },
        }),
        get: async () => ({
          type: "public-key",
          id: new Uint8Array([1, 2, 3, 4]),
          rawId: new Uint8Array([1, 2, 3, 4]),
          response: {
            authenticatorData: new Uint8Array([1]),
            clientDataJSON: new Uint8Array([2]),
            signature: new Uint8Array([3]),
          },
        }),
      },
      configurable: true,
    });
  });
}

// Configure the authenticator
test.beforeEach(async ({ context }) => {
  // Enable virtual authenticator environment
  await mockAuthenticator(context);
});
