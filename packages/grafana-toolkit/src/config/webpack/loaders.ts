import { getPluginJson } from '../utils/pluginValidation';

const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const supportedExtensions = ['css', 'scss'];

const getStylesheetPaths = (root: string = process.cwd()) => {
  return [`${root}/src/styles/light`, `${root}/src/styles/dark`];
};

export const getStylesheetEntries = (root: string = process.cwd()) => {
  const stylesheetsPaths = getStylesheetPaths(root);
  const entries: { [key: string]: string } = {};
  supportedExtensions.forEach(e => {
    stylesheetsPaths.forEach(p => {
      const entryName = p.split('/').slice(-1)[0];
      if (fs.existsSync(`${p}.${e}`)) {
        if (entries[entryName]) {
          console.log(`\nSeems like you have multiple files for ${entryName} theme:`);
          console.log(entries[entryName]);
          console.log(`${p}.${e}`);
          throw new Error('Duplicated stylesheet');
        } else {
          entries[entryName] = `${p}.${e}`;
        }
      }
    });
  });

  return entries;
};

export const hasThemeStylesheets = (root: string = process.cwd()) => {
  const stylesheetsPaths = getStylesheetPaths(root);
  const stylesheetsSummary: boolean[] = [];

  const result = stylesheetsPaths.reduce((acc, current) => {
    if (fs.existsSync(`${current}.css`) || fs.existsSync(`${current}.scss`)) {
      stylesheetsSummary.push(true);
      return acc && true;
    } else {
      stylesheetsSummary.push(false);
      return false;
    }
  }, true);

  const hasMissingStylesheets = stylesheetsSummary.filter(s => s).length === 1;

  // seems like there is one theme file defined only
  if (result === false && hasMissingStylesheets) {
    console.error('\nWe think you want to specify theme stylesheet, but it seems like there is something missing...');
    stylesheetsSummary.forEach((s, i) => {
      if (s) {
        console.log(stylesheetsPaths[i], 'discovered');
      } else {
        console.log(stylesheetsPaths[i], 'missing');
      }
    });

    throw new Error('Stylesheet missing!');
  }

  return result;
};

export const getStyleLoaders = () => {
  const shouldExtractCss = hasThemeStylesheets();

  const executiveLoader = shouldExtractCss
    ? {
        loader: MiniCssExtractPlugin.loader,
        options: {
          publicPath: '../',
        },
      }
    : 'style-loader';

  const cssLoader = {
    loader: 'css-loader',
    options: {
      importLoaders: 1,
      sourceMap: true,
    },
  };

  return [
    {
      test: /\.css$/,
      use: [executiveLoader, cssLoader],
    },
    {
      test: /\.scss$/,
      use: [executiveLoader, cssLoader, 'sass-loader'],
    },
  ];
};

export const getFileLoaders = () => {
  const shouldExtractCss = hasThemeStylesheets();
  const pluginJson = getPluginJson();

  return [
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            outputPath: 'static',
            name: '[name].[hash:8].[ext]',
            // When css is extracted the public path of statics is handled by MiniCssExtractPlugin.loader (see getStyleLoaders above)
            // Otherwise the css is loaded using style-loader and we need to be specific what's the full public path for a given plugin
            publicPath: shouldExtractCss ? undefined : `/public/plugins/${pluginJson.id}/static`,
          },
        },
      ],
    },
  ];
};
