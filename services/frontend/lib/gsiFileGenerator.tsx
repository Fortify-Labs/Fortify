export const GSIFileTemplate = (
	key: string
) => `"Fortify Gamestate Integration Script"
{
  "uri" "https://gsi.fortify.gg/gsi"
  "timeout"  "5.0"
  "buffer"  "1"
  "throttle"  "1"
  "heartbeat"  "1"
  "auth"
  {
    "key"  "${key}"
  }
  "data"
  {
    "public_player_state"  "1"
    "private_player_state"  "1"
  }
}
`;

export function download(filename: string, text: string) {
	var pom = document.createElement("a");
	pom.setAttribute(
		"href",
		"data:text/plain;charset=utf-8," + encodeURIComponent(text)
	);
	pom.setAttribute("download", filename);

	if (document.createEvent) {
		var event = document.createEvent("MouseEvents");
		event.initEvent("click", true, true);
		pom.dispatchEvent(event);
	} else {
		pom.click();
	}
}
