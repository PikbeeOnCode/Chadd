
const getPagination = (query) => {
    const parsedPage = Number.parseInt(query.page, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);

    const page =
        Number.isSafeInteger(parsedPage) && parsedPage > 0
            ? Math.min(parsedPage, 1000000)
            : 1;

    const limit =
        Number.isSafeInteger(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, 50)
            : 10;

    return {
        page,
        limit,
        offset: (page - 1) * limit,
    };
};

const buildPagination = (
    page,
    limit,
    total,
    totalKey = "totalItems"
) => {
    const totalPages = Math.ceil(total / limit);

    return {
        currentPage: page,
        limit,
        [totalKey]: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
};

export { getPagination, buildPagination };
