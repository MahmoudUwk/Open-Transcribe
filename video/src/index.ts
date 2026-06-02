import { registerRoot } from "remotion";
import { Root } from "./Root";

const font = new FontFace(
  "Inter",
  "url(https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2)"
);

font
  .load()
  .then(() => {
    document.fonts.add(font);
    registerRoot(Root);
  })
  .catch((err) => {
    console.error("Failed to load Inter font:", err);
    registerRoot(Root);
  });
