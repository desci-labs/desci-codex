import { ModelInstanceClient } from "@ceramic-sdk/model-instance-client";
import type { StreamClientParams } from "@ceramic-sdk/stream-client";

export const newStreamClient = (config: StreamClientParams) => {
  return new ModelInstanceClient(config);
};
