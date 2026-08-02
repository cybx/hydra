import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertIcon } from "@primer/octicons-react";

import { Modal, Button, SelectField } from "@renderer/components";
import { useToast } from "@renderer/hooks";
import { logger } from "@renderer/logger";
import type { DownloadSource } from "@types";
import "./publish-local-source-modal.scss";

interface PublishHost {
  id: string;
  name: string;
  retention: string;
}

interface PublishLocalSourceModalProps {
  visible: boolean;
  source: DownloadSource | null;
  onClose: () => void;
  onPublished: () => void;
}

export function PublishLocalSourceModal({
  visible,
  source,
  onClose,
  onPublished,
}: Readonly<PublishLocalSourceModalProps>) {
  const { t } = useTranslation("settings");
  const { showSuccessToast } = useToast();

  const [hosts, setHosts] = useState<PublishHost[]>([]);
  const [hostId, setHostId] = useState("");
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !source) return;

    setError(null);
    setIsLoading(false);

    window.electron.getPublishHosts().then((fetchedHosts) => {
      setHosts(fetchedHosts);
      setHostId((prev) => prev || fetchedHosts[0]?.id || "");
    });

    window.electron
      .inspectLocalSource(source.id)
      .then((result) => setHasPasskey(result.hasPasskey))
      .catch(() => setHasPasskey(false));
  }, [visible, source]);

  const handlePublish = async () => {
    if (!source) return;

    setIsLoading(true);
    setError(null);

    try {
      const { url } = await window.electron.uploadLocalSource(
        source.id,
        hostId
      );
      await window.electron.addDownloadSource(url);

      // The remote copy now supersedes the local one (same content + full
      // catalogue integration), so drop the local source to avoid a duplicate.
      await window.electron.removeDownloadSource(false, source.id);

      showSuccessToast(t("published_to_catalogue"));
      onPublished();
      onClose();
    } catch (err) {
      logger.error("Failed to publish local source:", err);
      setError(t("failed_publish"));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedHost = hosts.find((host) => host.id === hostId);

  return (
    <Modal
      visible={visible}
      title={t("publish_to_catalogue")}
      description={t("publish_to_catalogue_description")}
      onClose={onClose}
      clickOutsideToClose={!isLoading}
    >
      <div className="publish-local-source-modal">
        <p className="publish-local-source-modal__explain">
          {t("publish_explain")}
        </p>

        <SelectField
          label={t("publish_host")}
          value={hostId}
          onChange={(event) => setHostId(event.target.value)}
          options={hosts.map((host) => ({
            key: host.id,
            value: host.id,
            label: `${host.name} — ${host.retention}`,
          }))}
          disabled={isLoading}
        />

        {selectedHost && (
          <small className="publish-local-source-modal__retention">
            {t("publish_retention", { retention: selectedHost.retention })}
          </small>
        )}

        {hasPasskey && (
          <div className="publish-local-source-modal__warning">
            <AlertIcon size={16} />
            <span>{t("publish_passkey_warning")}</span>
          </div>
        )}

        {error && (
          <div className="publish-local-source-modal__error">{error}</div>
        )}

        <div className="publish-local-source-modal__actions">
          <Button
            type="button"
            theme="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isLoading || !hostId}
          >
            {isLoading ? t("publishing") : t("publish")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
