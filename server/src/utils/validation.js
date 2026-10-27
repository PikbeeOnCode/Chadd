
import { apiError } from "./apiError.js";

const MAX_BIGINT = 9223372036854775807n;

// Validate PostgreSQL BIGINT IDs.
const isValidId = (id) => {
    if (typeof id !== "string" || !/^\d{1,19}$/.test(id)) {
        return false;
    }

    const parsedId = BigInt(id);

    return parsedId > 0n && parsedId <= MAX_BIGINT;
};

// Validate required text and enforce its maximum length.
const validateText = (
    value,
    { fieldName = "Text", maxLength = 1000 } = {}
) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new apiError(400, `${fieldName} cannot be empty`);
    }

    if (value.trim().length > maxLength) {
        throw new apiError(
            400,
            `${fieldName} cannot exceed ${maxLength} characters`
        );
    }

    return value.trim();
};

export { isValidId, validateText };
