import { Pressable, Text, View } from "react-native";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";

import { LEGAL_LINKS } from "../constants/legalLinks";

async function openLegalLink(url) {
  await openBrowserAsync(url, {
    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
  });
}

function LegalLink({ label, url }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openLegalLink(url)}
      className="px-1 py-1"
    >
      <Text className="text-xs font-bold text-app-primary">{label}</Text>
    </Pressable>
  );
}

export default function LegalLinksFooter({
  includeIntro = true,
  className = "",
}) {
  return (
    <View className={`items-center ${className}`}>
      {includeIntro ? (
        <Text className="text-center text-xs leading-5 text-app-text-muted">
          By continuing, you agree to CutCare terms and acknowledge its privacy
          practices.
        </Text>
      ) : null}

      <View className="mt-2 flex-row flex-wrap items-center justify-center">
        <LegalLink label="Terms" url={LEGAL_LINKS.terms} />
        <Text className="text-xs text-app-text-muted">|</Text>
        <LegalLink label="Privacy" url={LEGAL_LINKS.privacy} />
        <Text className="text-xs text-app-text-muted">|</Text>
        <LegalLink label="Privacy Choices" url={LEGAL_LINKS.privacyChoices} />
        <Text className="text-xs text-app-text-muted">|</Text>
        <LegalLink label="Support" url={LEGAL_LINKS.support} />
      </View>
    </View>
  );
}
