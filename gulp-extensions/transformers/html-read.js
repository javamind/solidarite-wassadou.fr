'use strict'

const map = require('map-stream')
const fs = require('fs');
const gutil = require('gulp-util');
const PluginError = gutil.PluginError;

module.exports = function () {

  const pageMetadata = {
    '404.html' : {
      keywords: 'Solidarité Wassadou Pont-Trambouze Sénégal',
      title: 'Solidarité Wassadou Pont-Trambouze 404',
      description : 'Page non trouvée sur le serveur',
    },
    'index.html' : {
      keywords: "Solidarité Wassadou Pont-Trambouze Sénégal",
      title: "Solidarité Wassadou Pont-Trambouze",
      description : "Site de l'association Solidarité Wassadou à Pont Trambouze qui aide au développement du village de Wassadou au Sénégal (développement axé sur la jeunesse et l'éducation)"
    },
    'blog.html' : {
      keywords: 'Solidarité Wassadou Pont-Trambouze Sénégal Blog',
      title: 'Le blog Solidarité Wassadou Pont-Trambouze',
      description : "Le blog Solidarité Wassadou Pont-Trambouze regroupe des articles sur les activités de l'association",
      blog: true
    }
  };

  return map((file, next) => {

    const html = fs.readFileSync(file.path, 'utf8');
    file.fileName = file.path.substring(file.path.lastIndexOf('/') + 1, file.path.length);

    if (!pageMetadata[file.fileName]) throw new PluginError('html-read', `Missing index definition for ${file.path} in the build script html-read`);

    file.templateModel = {
      keywords: () => pageMetadata[file.fileName].keywords,
      title: () => pageMetadata[file.fileName].title,
      description: () => pageMetadata[file.fileName].description,
      contents: () => new Buffer(html),
      blog: () => pageMetadata[file.fileName].blog,
      canonicalUrl: () => file.fileName
    };

    next(null, file);
  });
}

