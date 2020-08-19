export const convertMS = (milliseconds: number) => {
	let seconds = Math.floor(milliseconds / 1000);
	let minute = Math.floor(seconds / 60);
	seconds = seconds % 60;

	let hour = Math.floor(minute / 60);
	minute = minute % 60;

	const day = Math.floor(hour / 24);
	hour = hour % 24;

	return {
		day,
		hour,
		minute,
		seconds,
	};
};
