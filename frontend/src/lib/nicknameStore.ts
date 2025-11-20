const NICKNAME_STORAGE_KEY = "adb-kit-nicknames";

function getNicknames(): Record<string, string> {
  try {
    const nicknames = localStorage.getItem(NICKNAME_STORAGE_KEY);
    return nicknames ? JSON.parse(nicknames) : {};
  } catch (error) {
    console.error("Failed to parse nicknames from localStorage", error);
    return {};
  }
}

export function setNickname(serial: string, nickname: string) {
  const nicknames = getNicknames();
  if (nickname) {
    nicknames[serial] = nickname;
  } else {
    delete nicknames[serial];
  }
  localStorage.setItem(NICKNAME_STORAGE_KEY, JSON.stringify(nicknames));
}

export function getNickname(serial: string): string | null {
  const nicknames = getNicknames();
  return nicknames[serial] || null;
}
