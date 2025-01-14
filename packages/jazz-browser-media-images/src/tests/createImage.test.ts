// @vitest-environment happy-dom

import { createJazzTestAccount, setActiveAccount } from "jazz-tools/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createImage } from "../index.js";

beforeEach(async () => {
  const account = await createJazzTestAccount();
  setActiveAccount(account);
});

vi.mock("pica", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      resize: vi.fn().mockResolvedValue({}),
    })),
  };
});

const originalWidth = 400;
const originalHeight = 300;

// Mock ImageBlobReduce
vi.mock("image-blob-reduce", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      toCanvas: vi.fn().mockImplementation(async () => ({
        toDataURL: () => "data:image/png;base64,mockedBase64Data",
      })),
      toBlob: vi.fn().mockImplementation(async (blob, { max }) => {
        // Return a new blob with mock dimensions based on max size
        return new Blob(["reduced-image-data"], { type: "image/jpeg" });
      }),
      after: vi.fn().mockImplementation((event, callback) => {
        // Simulate the _blob_to_image callback with mock dimensions
        callback({
          image: { width: originalWidth, height: originalHeight },
          orientation: 1,
        });
      }),
    })),
  };
});

describe("createImage", () => {
  it("should create an image definition with correct dimensions", async () => {
    // Create a test blob that simulates a 400x300 image
    const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    Object.defineProperty(blob, "size", { value: 1024 * 50 }); // 50KB

    const imageDefinition = await createImage(blob);

    expect(imageDefinition.originalSize).toEqual([
      originalWidth,
      originalHeight,
    ]);
    expect(imageDefinition.placeholderDataURL).toBeDefined();
  });
});
