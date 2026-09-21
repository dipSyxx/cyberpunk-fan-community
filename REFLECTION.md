# Refleksjon

Jeg valgte spor 2 med React, Vite og TypeScript fordi løsningen består av flere sider med gjentakende innhold og brukerinteraksjoner. React Router gir tydelig navigasjon mellom Home, Characters, Night City og Community, mens felles komponenter som Header, CharacterCard, DiscussionCard og ReactionButton hindrer duplisering. Innholdet ligger i egne datafiler, slik at statiske arrays senere kan erstattes med API-kall uten at hele grensesnittet må skrives om.

Designet er bygget mobile first. Flexbox brukes til mindre layoutgrupper som navigasjon, knapper og metadata, mens CSS Grid brukes til karakter-, distrikts- og innholdskort. Ved 768 og 1100 piksler endres kolonner, typografi og avstander slik at de samme semantiske elementene fungerer på mobil, nettbrett og desktop. Farger, fonter og størrelser er samlet som CSS-variabler. Dette gjør uttrykket konsekvent og enklere å vedlikeholde.

Interaktiviteten er laget uten backend, i tråd med oppgavens avgrensning. Brukeren kan åpne mobilmenyen, markere favorittkarakterer, filtrere favoritter, lagre bydeler, like diskusjoner og opprette en lokal diskusjon. Valgene lagres i `localStorage`, slik at de fortsatt vises etter refresh. Nye diskusjoner merkes indirekte som lokale ved at skjemaet forklarer at innholdet bare lagres i nettleseren. I en senere versjon kan datafilene erstattes med database og API.

Universell utforming er implementert i selve løsningen: semantiske elementer, knapper i stedet for klikkbare `div`-elementer, synlig tastaturfokus, Escape-støtte i mobilmenyen, store trykkflater, `aria`-tilstander og beskrivende bildetekster. Farger brukes sammen med tekst og symboler, ikke som eneste statusmarkør. Løsningen respekterer også redusert bevegelse.

De fire mobilrammene og meny-overlayet i Figma ble brukt som direkte visuell referanse. Mål, mellomrom, farger, skygger, typografi, kortstruktur, sidemarkører og bildecrop er overført til en felles React-struktur. Figma-bildene ble kontrollert mot de lokalt lagrede offisielle filene med SHA-256 og var identiske. Desktopvisningen er en responsiv videreføring av den samme komponentstrukturen, siden de oppgitte designrammene er mobile.
