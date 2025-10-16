import React from 'react';

const InstitutionalSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Título Principal */}
          <h2 className="text-3xl md:text-4xl font-bold text-skina-dark dark:text-white mb-6">
            Sobre a <span className="text-skina-green">Skina Eco Peças</span>
          </h2>
          
          {/* Linha decorativa */}
          <div className="w-24 h-1 bg-skina-green mx-auto mb-8"></div>
          
          {/* Conteúdo Principal */}
          <div className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 space-y-6">
            <p>
              Na <strong className="text-skina-green">Skina Eco Peças</strong>, somos referência em 
              peças automotivas no Setor H Norte, oferecendo produtos originais e 
              acessórios de alta qualidade.
            </p>
            
            <p>
              Trabalhamos com as <strong className="text-skina-green">melhores marcas do mercado</strong>: 
              peças Jeep, peças Mopar, peças Fiat, peças Chevrolet, 
              peças Volkswagen e peças RAM.
            </p>
            
            <p>
              Garantimos procedência, durabilidade e atendimento especializado, com 
              <strong className="text-skina-green">entrega rápida</strong> e 
              <strong className="text-skina-green"> suporte técnico completo</strong> para todo o Brasil.
            </p>
          </div>
          
          {/* Destaques em Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-skina-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-skina-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-skina-dark dark:text-white mb-2">
                Qualidade Garantida
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Produtos originais com procedência e durabilidade comprovadas
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-skina-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-skina-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-skina-dark dark:text-white mb-2">
                Entrega Rápida
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Logística eficiente para todo o Brasil com agilidade
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-skina-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-skina-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-skina-dark dark:text-white mb-2">
                Suporte Técnico
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Atendimento especializado e suporte completo
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstitutionalSection;