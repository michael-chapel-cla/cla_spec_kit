// Receipt upload uses multipart/form-data — validated at the route level
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
