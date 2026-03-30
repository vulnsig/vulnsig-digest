import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

/** Strip the per-subscriber unsubscribe anchor before publishing publicly. */
function stripUnsubscribeLink(html: string): string {
  return html.replace(/<a[^>]*\{\{UNSUBSCRIBE_URL\}\}[^>]*>.*?<\/a>/gi, "");
}

export async function publishLatestDigest(
  bucket: string,
  html: string,
  summary: string,
): Promise<void> {
  await Promise.all([
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: "digest/latest.html",
        Body: stripUnsubscribeLink(html),
        ContentType: "text/html; charset=utf-8",
        CacheControl: "no-cache, no-store, must-revalidate",
      }),
    ),
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: "digest/summary.txt",
        Body: summary,
        ContentType: "text/plain; charset=utf-8",
        CacheControl: "no-cache, no-store, must-revalidate",
      }),
    ),
  ]);
}
