require('dotenv').config();

const { connectDatabase, client, getCollections } = require('./src/config/database');
const {
  parseBase64Image,
  uploadBufferToFilestack,
  getExtensionFromContentType
} = require('./src/utils/filestack');

const IMAGE_SLOTS = [1, 2, 3, 4, 5];

const buildFilename = (productId, slot, contentType) => {
  const extension = getExtensionFromContentType(contentType);
  return `product-${productId}-image-${slot}.${extension}`;
};

async function migrateProductImages() {
  await connectDatabase();
  const { productCollection, productImageCollection } = getCollections();

  const products = await productCollection.find({}, {
    projection: {
      image_1: 1,
      image_2: 1,
      image_3: 1,
      image_4: 1,
      image_5: 1
    }
  }).toArray();

  let migratedCount = 0;

  for (const product of products) {
    const productUpdate = {};

    for (const slot of IMAGE_SLOTS) {
      const fieldName = `image_${slot}`;
      const imageValue = product[fieldName];

      if (!imageValue || typeof imageValue !== 'string') {
        continue;
      }

      const existingImageDoc = await productImageCollection.findOne({
        productId: product._id,
        slot
      });

      if (existingImageDoc?.url) {
        productUpdate[fieldName] = existingImageDoc.url;
        continue;
      }

      if (/^https?:\/\//i.test(imageValue) || imageValue.startsWith('/assets/') || imageValue.startsWith('assets/')) {
        await productImageCollection.updateOne(
          { productId: product._id, slot },
          {
            $set: {
              productId: product._id,
              slot,
              isPrimary: slot === 1,
              provider: 'existing',
              url: imageValue,
              updatedAt: new Date()
            },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );
        productUpdate[fieldName] = imageValue;
        continue;
      }

      const parsed = parseBase64Image(imageValue);
      if (!parsed) {
        continue;
      }

      const uploadResult = await uploadBufferToFilestack({
        buffer: parsed.buffer,
        contentType: parsed.contentType,
        filename: buildFilename(product._id.toString(), slot, parsed.contentType),
        pathPrefix: `${product._id.toString()}/`
      });

      await productImageCollection.updateOne(
        { productId: product._id, slot },
        {
          $set: {
            productId: product._id,
            slot,
            isPrimary: slot === 1,
            provider: 'filestack',
            url: uploadResult.url,
            handle: uploadResult.handle || uploadResult.key || '',
            storageKey: uploadResult.key || '',
            filename: uploadResult.filename || buildFilename(product._id.toString(), slot, parsed.contentType),
            mimeType: uploadResult.type || parsed.contentType,
            size: uploadResult.size || parsed.buffer.length,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      productUpdate[fieldName] = uploadResult.url;
      migratedCount += 1;
      console.log(`Migrated ${product._id} ${fieldName}`);
    }

    if (Object.keys(productUpdate).length > 0) {
      await productCollection.updateOne(
        { _id: product._id },
        { $set: productUpdate }
      );
    }
  }

  console.log(`Migration completed. Uploaded ${migratedCount} images.`);
}

migrateProductImages()
  .catch((error) => {
    console.error('Image migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
