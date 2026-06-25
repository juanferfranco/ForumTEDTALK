export const CONFIG = {
  title: "Relevo generacional",
  brandLine: "Future Leaders Forum · Fórum UPB",
  defaultLanguage: "pt",
  aspectRatio: 16 / 9,
  particleCount: 138,
  connectionDistance: 165,
  transitionSpeed: 0.055,
  assets: {
    ceremonyImage: "./assets/ceremonia-grados-placeholder.png",
    byMoment: {
      "auditorio-grados": {
        type: "image",
        src: "./assets/ceremonia-grados-placeholder.png",
        alt: "Ceremonia de grados en un auditorio universitario",
        placement: "background",
      },
    },
  },
  qr: {
    memoryUrl: "https://juanferfranco.github.io/ForumTEDTALK/",
    socialUrl: "https://www.instagram.com/centrodeeventosupb/",
    memoryImage: "./assets/qr-memory.png",
    socialImage: "./assets/qr-social.png",
    labels: {
      es: {
        memory: "Memorias",
        social: "@centrodeeventosupb",
      },
      pt: {
        memory: "Anais",
        social: "@centrodeeventosupb",
      },
    },
  },
  palette: {
    base: "#070808",
    ink: "#f7f7f4",
    eventCyan: "#08a9dd",
    eventRed: "#f7353f",
    eventMagenta: "#e96daa",
    eventBlack: "#222326",
    eventSilver: "#dde2e6",
    forumGold: "#d6a94f",
  },
};
