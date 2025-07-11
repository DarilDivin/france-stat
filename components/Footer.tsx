import React from 'react';
import { Github, Mail, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-900/80 via-gray-800/70 to-gray-900/80 border-t border-gray-800/50 backdrop-blur-sm mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section principale */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              France Stat
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Plateforme interactive pour explorer et visualiser les statistiques démographiques françaises.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Données 2023</span>
              <span>•</span>
              <span>INSEE</span>
            </div>
          </div>

          {/* Liens utiles */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300">Ressources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.insee.fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-1"
                >
                  INSEE
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://data.gouv.fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-1"
                >
                  Data.gouv.fr
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact et réseaux */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300">Contact</h4>
            <div className="flex space-x-3">
              <a
                href="https://github.com/DarilDivin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:daril.djodjokouton@gmail.com"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Ligne de séparation et copyright */}
        <div className="border-t border-gray-800/50 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p className="text-xs text-gray-500">
            © {currentYear} France Stat. Créé par{' '}
            <a 
              href="https://daril.fr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              Daril DJODJO KOUTON
            </a>
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Fait avec 🧠 en France</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
