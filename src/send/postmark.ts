import { ServerClient } from "postmark";

export interface Subscriber {
  email: string;
  unsubscribeToken: string;
}

export interface SendOptions {
  postmarkToken: string;
  from: string;
  subscribers: Subscriber[];
  subject: string;
  html: string; // pre-rendered, with {{UNSUBSCRIBE_URL}} placeholder
}

export async function sendDigest({
  postmarkToken,
  from,
  subscribers,
  subject,
  html,
}: SendOptions) {
  const client = new ServerClient(postmarkToken);

  const results = await Promise.allSettled(
    subscribers.map((subscriber) => {
      const unsubscribeUrl = `https://vulnsig.io/unsubscribe?token=${subscriber.unsubscribeToken}`;
      const personalizedHtml = html.replace(
        /\{\{UNSUBSCRIBE_URL\}\}/g,
        unsubscribeUrl,
      );
      return client.sendEmail({
        From: from,
        To: subscriber.email,
        Subject: subject,
        HtmlBody: personalizedHtml,
        MessageStream: "broadcast",
      });
    }),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error(
      `Failed to send to ${failures.length}/${subscribers.length} recipients`,
    );
    for (const f of failures) {
      console.error((f as PromiseRejectedResult).reason);
    }
  }

  return {
    total: subscribers.length,
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: failures.length,
  };
}
