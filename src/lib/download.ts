/** Entrega un archivo al navegador y suelta el object URL en cuanto termina. */

export const triggerDownload = (filename: string, mime: string, contents: string): void => {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
