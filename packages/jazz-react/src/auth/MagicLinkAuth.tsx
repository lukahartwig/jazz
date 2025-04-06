import {
  MagicLinkAuthConsumerOptions,
  MagicLinkAuthProviderOptions,
  useCreateMagicLinkAuthAsConsumer as useCreateMagicLinkAuthAsConsumerCore,
  useCreateMagicLinkAuthAsProvider as useCreateMagicLinkAuthAsProviderCore,
  useHandleMagicLinkAuthAsConsumer as useHandleMagicLinkAuthAsConsumerCore,
  useHandleMagicLinkAuthAsProvider as useHandleMagicLinkAuthAsProviderCore,
} from "jazz-react-core";

export function useCreateMagicLinkAuthAsProvider(
  options?: Partial<MagicLinkAuthProviderOptions>,
) {
  return useCreateMagicLinkAuthAsProviderCore(window.location.origin, options);
}

export function useCreateMagicLinkAuthAsConsumer(
  options?: Partial<MagicLinkAuthConsumerOptions>,
) {
  return useCreateMagicLinkAuthAsConsumerCore(window.location.origin, options);
}

export function useHandleMagicLinkAuthAsConsumer(
  options?: Partial<MagicLinkAuthConsumerOptions>,
) {
  return useHandleMagicLinkAuthAsConsumerCore(
    window.location.origin,
    window.location.href,
    options,
  );
}

export function useHandleMagicLinkAuthAsProvider(
  options?: Partial<MagicLinkAuthProviderOptions>,
) {
  return useHandleMagicLinkAuthAsProviderCore(
    window.location.origin,
    window.location.href,
    options,
  );
}
