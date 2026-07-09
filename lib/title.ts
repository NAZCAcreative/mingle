export function cleanRoomTitle(title: string) {
  const cleaned = title
    .replace(/(?:https?:\/\/)?open\.kakao\.com\/o\/[A-Za-z0-9_-]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s|,/-]+$/g, "")
    .trim();

  return cleaned || title.trim();
}
