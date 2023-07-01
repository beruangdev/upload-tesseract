import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const IMAGE_DIR = "public/image";
const THUMBNAIL_DIR = "public/thumbnail";
const THUMBNAIL_SIZES = [300, 600, 1000];

async function createThumbnailFile({
  size,
  buffer,
  fileName,
}: {
  size: number;
  fileName: string;
  buffer: Buffer;
}) {
  const thumbnailBuffer = await sharp(buffer).resize(size).toBuffer();
  const thumbnailFilePath = `${THUMBNAIL_DIR}-${size}/${fileName}`;
  return fs.writeFileSync(thumbnailFilePath, thumbnailBuffer);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const formDataEntryValues: FormDataEntryValue[] = Array.from(
    formData.values()
  );
  for (const formDataEntryValue of formDataEntryValues) {
    if (
      typeof formDataEntryValue === "object" &&
      "arrayBuffer" in formDataEntryValue
    ) {
      const file = formDataEntryValue as Blob;
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${IMAGE_DIR}/${fileName}`;
      fs.writeFileSync(filePath, buffer);

      for (const size of THUMBNAIL_SIZES) {
        await createThumbnailFile({ size, buffer, fileName });
      }
    }
  }
  return NextResponse.json({ success: true });
}

export const config = {
  runtime: "edge",
};
export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page") || 1);
  const perPage = Number(req.nextUrl.searchParams.get("perPage") || 20);

  const files = fs.readdirSync(IMAGE_DIR);
  const reversedFiles = files.reverse();
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  if (!files) {
    return NextResponse.json({ files });
  }

  const images = reversedFiles
    .filter((file) => file.endsWith(".jpg") || file.endsWith(".png"))
    .map((file, index) => {
      let image = {
        id: index + 1,
        filename: file,
        url: `${req.nextUrl.protocol}//${req.nextUrl.host}/image/${file}`,
        metadata: {
          size: fs.statSync(path.join(IMAGE_DIR, file)).size,
          created_at: fs.statSync(path.join(IMAGE_DIR, file)).birthtime,
        },
        thumbnails: THUMBNAIL_SIZES.map((THUMBNAIL_SIZE) => {
          return `${req.nextUrl.protocol}//${req.nextUrl.host}/thumbnail-${THUMBNAIL_SIZE}/${file}`;
        }),
      };

      return image;
    });

  const paginatedImages = images.slice(startIndex, endIndex);

  const total = images.length;
  const lastPage = Math.ceil(total / perPage);

  return NextResponse.json({
    currentPage: page,
    perPage: perPage,
    total: total,
    lastPage: lastPage,
    data: paginatedImages,
  });
}
