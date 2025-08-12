import http from 'http';

function testAPI() {
  return new Promise((resolve, reject) => {
    console.log('Testando API de produtos...');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/products?limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log('Status:', res.statusCode);
          const jsonData = JSON.parse(data);
          console.log('Dados recebidos:', JSON.stringify(jsonData, null, 2));
          
          if (jsonData.success && jsonData.data && jsonData.data.products) {
            console.log('\nProdutos com featured:');
            jsonData.data.products.forEach(product => {
              console.log(`- ${product.name}: featured = ${product.featured}`);
            });
          }
          resolve();
        } catch (error) {
          console.error('Erro ao parsear JSON:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Erro na requisição:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

testAPI().catch(console.error);