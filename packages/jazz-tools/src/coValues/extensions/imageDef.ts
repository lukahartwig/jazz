import { co } from "../../internal.js";
import { FileStream } from "../coFeed.js";
import { CoMap } from "../coMap.js";

/** @category Media */
export class ImageDefinition extends CoMap {
  originalSize = co.json<[number, number]>();
  placeholderDataURL? = co.string;

  [co.items] = co.ref(FileStream);
  [res: `${number}x${number}`]: co<FileStream | null>;

  highestResAvailable(options?: {
    maxWidth?: number;
    targetWidth?: number;
  }): { res: `${number}x${number}`; stream: FileStream } | undefined {
    const resolutions = Object.keys(this).filter((key) =>
      key.match(/^\d+x\d+$/),
    ) as `${number}x${number}`[];

    let maxWidth = options?.maxWidth;

    if (options?.targetWidth) {
      const targetWidth = options.targetWidth;
      const widths = resolutions.map((res) => Number(res.split("x")[0]));

      maxWidth = Math.min(...widths.filter((w) => w >= targetWidth));
    }

    const validResolutions = resolutions.filter(
      (key) => maxWidth === undefined || Number(key.split("x")[0]) <= maxWidth,
    ) as `${number}x${number}`[];

    // Sort the resolutions by width, smallest to largest
    validResolutions.sort((a, b) => {
      const aWidth = Number(a.split("x")[0]);
      const bWidth = Number(b.split("x")[0]);
      return aWidth - bWidth; // Sort smallest to largest
    });

    let highestAvailableResolution: `${number}x${number}` | undefined;

    for (const resolution of validResolutions) {
      if (this[resolution] && this[resolution]?.getChunks()) {
        highestAvailableResolution = resolution;
      }
    }

    // Return the highest complete resolution if we found one
    return (
      highestAvailableResolution && {
        res: highestAvailableResolution,
        stream: this[highestAvailableResolution]!,
      }
    );
  }
}
