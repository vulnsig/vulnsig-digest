import { ServerClient } from "postmark";
import { render } from "@react-email/render";
import { DigestEmail, type DigestEmailProps } from "../email/DigestEmail.js";

export interface Subscriber {
  email: string;
  unsubscribeToken: string;
}

export interface SendOptions {
  postmarkToken: string;
  from: string;
  subscribers: Subscriber[];
  props: DigestEmailProps;
}

export async function sendDigest({
  postmarkToken,
  from,
  subscribers,
  props,
}: SendOptions) {
  const client = new ServerClient(postmarkToken);
  const html = await render(DigestEmail(props));
  const subject = `VulnSig Digest: ${props.date}`;

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
