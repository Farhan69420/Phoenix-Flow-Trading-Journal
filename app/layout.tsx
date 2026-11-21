import "./globals.css";
import { Manrope } from "next/font/google";
import SpaceBackground from "./components/SpaceBackground";
import { ThemeProvider } from "./components/ThemeProvider";

const font = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata = {
  title: "Phoenix Flow — Long & Short Multi-Asset Trading Cockpit",
  description: "Multi-asset long & short trading journal with leverage analytics, risk guardrails, and live PDF strategy playbooks.",
};

const themeInitScript = `
  try {
    var t = localStorage.getItem('tj-theme');
    var isLight = t === 'light';
    document.documentElement.classList.toggle('dark', !isLight);
    document.documentElement.classList.toggle('light', isLight);
  } catch (e) {}
`;

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={font.className}>
        <ThemeProvider>
          <SpaceBackground />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
