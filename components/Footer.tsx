import React from 'react';
import { Github, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          © {currentYear} France Stat — données{' '}
          <a
            href="https://www.insee.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand transition-colors duration-200"
          >
            INSEE
          </a>{' '}
          2026 · Créé par{' '}
          <a
            href="https://daril.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:opacity-80 transition-opacity duration-200"
          >
            Daril DJODJO KOUTON
          </a>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://data.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand transition-colors duration-200"
          >
            Data.gouv.fr
          </a>
          <a
            href="https://github.com/DarilDivin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand transition-colors duration-200"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="mailto:daril.djodjokouton@gmail.com"
            className="hover:text-brand transition-colors duration-200"
            aria-label="Email"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
