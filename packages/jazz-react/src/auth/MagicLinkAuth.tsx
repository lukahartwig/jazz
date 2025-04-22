import {
  type UseMagicLinkAuthAsTargetOptions,
  type UseMagicLinkAuthAsSourceOptions,
  useCreateMagicLinkAuthAsTarget,
  useCreateMagicLinkAuthAsSource,
  useHandleMagicLinkAuthAsTarget,
  useHandleMagicLinkAuthAsSource,
} from "jazz-react-core";
import { useRef } from "react";

export function useCreateMagicLinkAuth(
  options: {
    as: "source";
  } & Partial<UseMagicLinkAuthAsSourceOptions>,
): ReturnType<typeof useCreateMagicLinkAuthAsSource>;
export function useCreateMagicLinkAuth(
  options: {
    as: "target";
  } & Partial<UseMagicLinkAuthAsTargetOptions>,
): ReturnType<typeof useCreateMagicLinkAuthAsTarget>;
export function useCreateMagicLinkAuth({
  as: mode,
  ...options
}:
  | ({
      as: "source";
    } & Partial<UseMagicLinkAuthAsSourceOptions>)
  | ({
      as: "target";
    } & Partial<UseMagicLinkAuthAsTargetOptions>)) {
  const initialMode = useRef(mode);

  if (initialMode.current !== mode) {
    console.warn("useCreateMagicLinkAuth mode cannot be changed once mounted.");
  }

  if (initialMode.current === "source") {
    return useCreateMagicLinkAuthAsSource(window.location.origin, options);
  } else {
    return useCreateMagicLinkAuthAsTarget(window.location.origin, options);
  }
}

export function useHandleMagicLinkAuth(
  options: {
    as: "source";
  } & Partial<UseMagicLinkAuthAsSourceOptions>,
): ReturnType<typeof useHandleMagicLinkAuthAsSource>;
export function useHandleMagicLinkAuth(
  options: {
    as: "target";
  } & Partial<UseMagicLinkAuthAsTargetOptions>,
): ReturnType<typeof useHandleMagicLinkAuthAsTarget>;
export function useHandleMagicLinkAuth({
  as: mode,
  ...options
}:
  | ({
      as: "source";
    } & Partial<UseMagicLinkAuthAsSourceOptions>)
  | ({
      as: "target";
    } & Partial<UseMagicLinkAuthAsTargetOptions>)) {
  const initialMode = useRef(mode);

  if (initialMode.current !== mode) {
    console.warn("useHandleMagicLinkAuth mode cannot be changed once mounted.");
  }

  if (initialMode.current === "source") {
    return useHandleMagicLinkAuthAsSource(
      window.location.origin,
      window.location.href,
      options,
    );
  } else {
    return useHandleMagicLinkAuthAsTarget(
      window.location.origin,
      window.location.href,
      options,
    );
  }
}
