import { DEFAULT_FRAMEWORK, isValidFramework } from "@/lib/framework";
import { useParams } from "next/navigation";

export const useFramework = () => {
  const { framework } = useParams<{ framework?: string }>();

  return framework && isValidFramework(framework)
    ? framework
    : DEFAULT_FRAMEWORK;
};
