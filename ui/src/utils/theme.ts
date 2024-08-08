export function toggleHTMLClass(darkMode: boolean) {
  if (darkMode) {
    document.documentElement.classList.add("darkmode");
    document.documentElement.classList.remove("lightmode");
  } else {
    document.documentElement.classList.add("lightmode");
    document.documentElement.classList.remove("darkmode");
  }
}
