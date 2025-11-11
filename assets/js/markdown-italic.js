// Fonction pour convertir **texte** ou __texte__ en italique et préserver les sauts de ligne
function parseMarkdownItalic(text) {
  if (!text) return "";
  
  // Échapper le HTML existant pour éviter les injections
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  // Convertir **texte** en <em>texte</em>
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<em>$1</em>");
  
  // Convertir __texte__ en <em>texte</em>
  escaped = escaped.replace(/__([^_]+)__/g, "<em>$1</em>");
  
  // Convertir les sauts de ligne en <br> pour préserver le formatage
  escaped = escaped.replace(/\n/g, "<br>");
  
  return escaped;
}

// Exporter la fonction globalement
window.parseMarkdownItalic = parseMarkdownItalic;

