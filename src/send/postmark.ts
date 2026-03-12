import { ServerClient } from "postmark";
import { render } from "@react-email/render";
import { DigestEmail, type DigestEmailProps } from "../email/DigestEmail.js";

export interface SendOptions {
  postmarkToken: string;
  from: string;
  recipients: string[];
  props: DigestEmailProps;
}

export async function sendDigest({
  postmarkToken,
  from,
  recipients,
  props,
}: SendOptions) {
  const client = new ServerClient(postmarkToken);
  const html = await render(DigestEmail(props));
  const subject = `VulnSig Daily — ${props.cves.length} new CVEs, ${props.kevs.length} KEV additions — ${props.date}`;

  const results = await Promise.allSettled(
    recipients.map((to) =>
      client.sendEmail({
        From: from,
        To: to,
        Subject: subject,
        HtmlBody: html,
        MessageStream: "broadcast",
      }),
    ),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error(
      `Failed to send to ${failures.length}/${recipients.length} recipients`,
    );
    for (const f of failures) {
      console.error((f as PromiseRejectedResult).reason);
    }
  }

  return {
    total: recipients.length,
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: failures.length,
  };
}
