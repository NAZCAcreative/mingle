export function cleanRoomTitle(title: string) {
  const cleaned = title
    .replace(/\s*(?:https?:\/\/)?open\.kakao\.com\/o\/[A-Za-z0-9_-]+.*$/i, "")
    .replace(/[\s|,/-]+$/g, "")
    .trim();

  return cleaned || title.trim();
}
