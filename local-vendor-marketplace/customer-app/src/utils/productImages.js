export const getImageUrl = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || image.secureUrl || image.secure_url || image.imageUrl || image.path || image.uri || '';
};

export const getProductImages = (product) => (product?.images || []).map(getImageUrl).filter(Boolean);

export const getProductThumbnail = (product) => {
  const images = getProductImages(product);
  const thumbnailIndex = Number(product?.thumbnailIndex || 0);

  return (
    getImageUrl(product?.thumbnailImage) ||
    getImageUrl(product?.image) ||
    getImageUrl(product?.imageUrl) ||
    getImageUrl(product?.photo) ||
    getImageUrl(product?.thumbnail) ||
    images[thumbnailIndex] ||
    images[0] ||
    ''
  );
};
