import { Body, Container, Head, Html, Preview } from "@react-email/components";
import type { CveEntry, CurationResult, ProductInfo } from "../data/types.js";
import { Header } from "./components/Header.js";
import { SummarySection } from "./components/SummarySection.js";
import { KevSection } from "./components/KevSection.js";
import { CveSection } from "./components/CveSection.js";
import { Footer } from "./components/Footer.js";
import { colors, fonts } from "./styles.js";

export interface DigestEmailProps {
  date: string;
  curation: CurationResult;
  kevs: CveEntry[];
  glyphBaseUrl: string;
  kevWindowDays?: number;
  products?: Record<string, ProductInfo>;
}

export function DigestEmail({
  date,
  curation,
  kevs,
  glyphBaseUrl,
  kevWindowDays = 7,
  products: productMap,
}: DigestEmailProps) {
  // For the summary narrative, highlight all known product names.
  const productNames = new Set(curation.curated.map((c) => c.product));
  if (productMap) {
    for (const info of Object.values(productMap)) {
      productNames.add(info.product);
    }
  }
  const previewText = `VulnSig Digest: ${date}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header date={date} />
          <SummarySection
            summary={curation.summary}
            curatedWithLlm={curation.curatedWithLlm}
            products={productNames}
          />
          <KevSection
            entries={kevs}
            glyphBaseUrl={glyphBaseUrl}
            windowDays={kevWindowDays}
            products={productMap}
          />
          <CveSection
            curated={curation.curated}
            glyphBaseUrl={glyphBaseUrl}
            products={productMap}
          />
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

// backgroundColor is behind main divs
const body: React.CSSProperties = {
  backgroundColor: colors.zinc700,
  fontFamily: fonts.sans,
  margin: 0,
  padding: "24px 0",
};

// backgroundColor is main body content
const container: React.CSSProperties = {
  backgroundColor: colors.zinc900,
  maxWidth: 600,
  margin: "0 auto",
  borderRadius: 8,
  overflow: "hidden",
  border: `1px solid ${colors.zinc800}`,
};

export default DigestEmail;
