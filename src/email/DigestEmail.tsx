import { Body, Container, Head, Html, Preview } from "@react-email/components";
import type { CveEntry } from "../data/types.js";
import { Header } from "./components/Header.js";
import { KevSection } from "./components/KevSection.js";
import { CveSection } from "./components/CveSection.js";
import { Footer } from "./components/Footer.js";
import { colors, fonts } from "./styles.js";

export interface DigestEmailProps {
  date: string;
  cves: CveEntry[];
  kevs: CveEntry[];
  glyphBaseUrl: string;
}

export function DigestEmail({
  date,
  cves,
  kevs,
  glyphBaseUrl,
}: DigestEmailProps) {
  const previewText = `${cves.length} new CVEs, ${kevs.length} KEV additions — ${date}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header date={date} />
          <KevSection entries={kevs} glyphBaseUrl={glyphBaseUrl} />
          <CveSection entries={cves} glyphBaseUrl={glyphBaseUrl} />
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  fontFamily: fonts.sans,
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: colors.bg,
  maxWidth: 600,
  margin: "0 auto",
  borderRadius: 8,
  overflow: "hidden",
};

export default DigestEmail;
