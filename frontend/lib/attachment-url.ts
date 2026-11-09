import { API_BASE } from "@/lib/api-client";

export type AnnouncementAttachment = {
  id: number;
  announcement_id: number;
  file_path: string;
  file_url?: string;
  original_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  is_image?: boolean;
};

/** Origen del backend sin el sufijo /api: http://localhost:8000 */
export const BACKEND_ORIGIN = API_BASE.replace(/\/+api$/, "");

/**
 * URL publica de un adjunto.
 *
 * El backend arma `file_url` con APP_URL, que no incluye el puerto
 * ("http://localhost/storage/..."), asi que hay que agregarlo: sin puerto la
 * peticion cae en el puerto 80 y responde 404.
 */
export function getAttachmentUrl(attachment: AnnouncementAttachment): string {
  if (attachment.file_url && /^https?:\/\//i.test(attachment.file_url)) {
    try {
      const remoteUrl = new URL(attachment.file_url);
      const backendUrl = new URL(BACKEND_ORIGIN);
      const isLocalHost =
        remoteUrl.hostname === "localhost" || remoteUrl.hostname === "127.0.0.1";

      if (isLocalHost && !remoteUrl.port && backendUrl.port) {
        remoteUrl.port = backendUrl.port;
      }

      return remoteUrl.toString();
    } catch {
      return attachment.file_url;
    }
  }

  if (attachment.file_url) {
    return `${BACKEND_ORIGIN}${
      attachment.file_url.startsWith("/") ? "" : "/"
    }${attachment.file_url}`;
  }

  return `${BACKEND_ORIGIN}/storage/${attachment.file_path}`;
}

/** ¿El adjunto es una imagen? El backend no siempre marca `is_image`. */
export function isImageAttachment(attachment: AnnouncementAttachment): boolean {
  return (
    Boolean(attachment.is_image) || (attachment.mime_type?.startsWith("image/") ?? false)
  );
}
