

export const imageUrl = (thumbnail) => {
    const baseUrl = import.meta.env.VITE_APP_URL || 'https://course-server.sahet-dev.com';
    return `${baseUrl}/storage/${thumbnail}`;
};
