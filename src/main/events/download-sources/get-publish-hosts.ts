import { registerEvent } from "../register-event";
import { PUBLISH_HOSTS } from "@main/services";
import type { PublishHost } from "@main/services";

const getPublishHosts = async (): Promise<PublishHost[]> => PUBLISH_HOSTS;

registerEvent("getPublishHosts", getPublishHosts);
