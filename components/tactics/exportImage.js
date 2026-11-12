// Saves the board as a PNG picture, with the title and the step's caption above it.
// svg: the board's <svg> element.
export async function exportBoardPng(svg, { title = "", caption = "", filename = "tactic.png" } = {}) {
  const clone = svg.cloneNode(true);

  // A picture has no CSS animation: turn the positions into plain SVG positions
  clone.querySelectorAll("[data-x]").forEach((el) => {
    el.setAttribute("transform", `translate(${el.dataset.x} ${el.dataset.y})`);
    el.style.transform = "";
    el.style.transition = "";
  });
  // Selection rings and invisible touch areas are not part of the picture
  clone.querySelectorAll("[data-ui]").forEach((el) => el.remove());

  const vb = svg.viewBox.baseVal;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", vb.width);
  clone.setAttribute("height", vb.height);

  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const header = 110;
  const footer = 46;
  const canvas = document.createElement("canvas");
  canvas.width = vb.width;
  canvas.height = vb.height + header + footer;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#050d08";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#d4a017";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText((title || "Red Lions tactic").slice(0, 38), 24, 52);

  ctx.fillStyle = "#e5e7eb";
  ctx.font = "26px Arial, sans-serif";
  ctx.fillText((caption || "").slice(0, 52), 24, 92);

  ctx.drawImage(img, 0, header);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("RED LIONS · JINZHOU", 24, header + vb.height + 31);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}