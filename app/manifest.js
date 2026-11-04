// Tells phones how to install the site as an app
export default function manifest() {
  return {
    id: "/",
    name: "Red Lions Jinzhou",
    short_name: "Red Lions",
    description: "Official website and players' portal of Red Lions, Jinzhou.",
    start_url: "/portal",
    scope: "/",
    display: "standalone",
    background_color: "#04140c",
    theme_color: "#04140c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}