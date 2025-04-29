import {
  type UseCrossDeviceAccountTransferAsSourceOptions,
  type UseCrossDeviceAccountTransferAsTargetOptions,
  useCreateCrossDeviceAccountTransferAsSource,
  useCreateCrossDeviceAccountTransferAsTarget,
  useHandleCrossDeviceAccountTransferAsSource,
  useHandleCrossDeviceAccountTransferAsTarget,
} from "jazz-react-core";
import { useRef } from "react";

export function useCreateCrossDeviceAccountTransfer(
  options: {
    as: "source";
  } & Partial<UseCrossDeviceAccountTransferAsSourceOptions>,
): ReturnType<typeof useCreateCrossDeviceAccountTransferAsSource>;
export function useCreateCrossDeviceAccountTransfer(
  options: {
    as: "target";
  } & Partial<UseCrossDeviceAccountTransferAsTargetOptions>,
): ReturnType<typeof useCreateCrossDeviceAccountTransferAsTarget>;
export function useCreateCrossDeviceAccountTransfer({
  as: mode,
  ...options
}:
  | ({
      as: "source";
    } & Partial<UseCrossDeviceAccountTransferAsSourceOptions>)
  | ({
      as: "target";
    } & Partial<UseCrossDeviceAccountTransferAsTargetOptions>)) {
  const initialMode = useRef(mode);

  if (initialMode.current !== mode) {
    console.warn(
      "useCreateCrossDeviceAccountTransfer mode cannot be changed once mounted.",
    );
  }

  if (initialMode.current === "source") {
    return useCreateCrossDeviceAccountTransferAsSource(
      window.location.origin,
      options,
    );
  } else {
    return useCreateCrossDeviceAccountTransferAsTarget(
      window.location.origin,
      options,
    );
  }
}

export function useHandleCrossDeviceAccountTransfer(
  options: {
    as: "source";
  } & Partial<UseCrossDeviceAccountTransferAsSourceOptions>,
): ReturnType<typeof useHandleCrossDeviceAccountTransferAsSource>;
export function useHandleCrossDeviceAccountTransfer(
  options: {
    as: "target";
  } & Partial<UseCrossDeviceAccountTransferAsTargetOptions>,
): ReturnType<typeof useHandleCrossDeviceAccountTransferAsTarget>;
export function useHandleCrossDeviceAccountTransfer({
  as: mode,
  ...options
}:
  | ({
      as: "source";
    } & Partial<UseCrossDeviceAccountTransferAsSourceOptions>)
  | ({
      as: "target";
    } & Partial<UseCrossDeviceAccountTransferAsTargetOptions>)) {
  const initialMode = useRef(mode);

  if (initialMode.current !== mode) {
    console.warn(
      "useHandleCrossDeviceAccountTransfer mode cannot be changed once mounted.",
    );
  }

  if (initialMode.current === "source") {
    return useHandleCrossDeviceAccountTransferAsSource(
      window.location.origin,
      window.location.href,
      options,
    );
  } else {
    return useHandleCrossDeviceAccountTransferAsTarget(
      window.location.origin,
      window.location.href,
      options,
    );
  }
}
