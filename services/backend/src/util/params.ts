export const getQueryParams = ({
	limit,
	offset,
}: {
	limit?: number | null;
	offset?: number | null;
}) => {
	if (!limit) {
		limit = 25;
	} else if (limit > 50) {
		limit = 50;
	}

	if (!offset) {
		offset = 0;
	}

	return {
		limit,
		offset,
	};
};
