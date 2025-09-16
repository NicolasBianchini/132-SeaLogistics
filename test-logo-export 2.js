// Teste simples para verificar se a logo está sendo carregada
console.log('=== TESTE DE CARREGAMENTO DA LOGO ===');

// Simular o carregamento da logo
fetch('/logo.png')
  .then(response => {
    console.log('Status da resposta:', response.status);
    console.log('OK:', response.ok);
    return response.blob();
  })
  .then(blob => {
    console.log('Logo carregada com sucesso!');
    console.log('Tamanho do arquivo:', blob.size, 'bytes');
    console.log('Tipo MIME:', blob.type);
    
    // Converter para base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      console.log('Base64 gerado com sucesso!');
      console.log('Tamanho do base64:', base64.length, 'caracteres');
      console.log('Primeiros 100 caracteres:', base64.substring(0, 100));
    };
    reader.readAsDataURL(blob);
  })
  .catch(error => {
    console.error('Erro ao carregar logo:', error);
  });

console.log('=== FIM DO TESTE ===');
