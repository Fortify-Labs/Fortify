export const dateFormatter = (date?: Date) => {
	if (!date) {
		return "";
	} else {
		return new Date(date).toLocaleString("en-US", { hour12: false });
	}
};
