const Debug = require('debug');
const fs = require('fs');
const mkdirp = require('mkdirp');
const slugify = require('slugify');

const { createFilePath } = require(`gatsby-source-filesystem`);

exports.onPreBootstrap = ({ store }) => {
  const debug = Debug('gatsby-theme-plume:onPreBoostrap');

  const { program } = store.getState();
  const dir = `${program.directory}/content`;
  debug(`ensuring ${dir} exists`);

  if (!fs.existsSync(dir)) {
    debug(`creating ${dir}`);
    mkdirp.sync(dir);

    debug(`adding a sample hello section folder`);
    mkdirp.sync(dir + '/styling');

    debug(`adding a sample world section item`);
    fs.writeFileSync(
      dir + '/styling' + '/tags.md',
      `
---
category: ['Styling']
title: Tags
---

# Custom tags

Here you can observe how most of the markdown tags and syntax is rendered. Of course, you can fully customize this !

# H1

This is the home page.

## H2

Lorem ipsum dez ezdaz idozaj dioazj doizajo dizajo idjaz oidj

Lorem ipsum dez ezdaz idozaj dioazj doizajo dizajo idjaz oidj

Lorem ipsum dez ezdaz idozaj dioazj doizajo dizajo idjaz oidj

### H3

Lorem ipsum dez ezdaz idozaj dioazj doizajo dizajo idjaz oidj

#### H4

Lorem ipsum dez ezdaz idozaj dioazj doizajo dizajo idjaz oidj

##### H5

Lorem ipsum dez ezdaz idozaj dioazj doizajo dizajo idjaz oidj

## Blockquote

> This is a nice quote right there !

## List

- Shopping list
  - Bacon
  - Eggs
  - Cheese

## Table

| Tables        |      Are      | Cool |
| ------------- | :-----------: | ---: |
| col 3 is      | right-aligned | 1600 |
| col 2 is      |   centered    |   12 |
| zebra stripes |   are neat    |    1 |      
    `.trim()
    );
  }

  if (!fs.existsSync(dir + '/home.md')) {
    debug(`adding a sample welcome file`);
    fs.writeFileSync(
      dir + '/home.md',
      `
# Welcome

This is the home page.
    `.trim()
    );
  }
};

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  const mdxPageTemplate = require.resolve(`./src/templates/mdx-page.js`);
  return graphql(
    `
      {
        allMdx {
          edges {
            node {
              id
              fields {
                slug
              }
              frontmatter {
                title
                category
              }
            }
          }
        }
      }
    `
  ).then(result => {
    if (result.errors) {
      throw result.errors;
    }

    // Create documentation pages
    const mdxDocuments = result.data.allMdx.edges;

    mdxDocuments.forEach(mdxDocument => {
      const slug = mdxDocument.node.fields.slug;

      createPage({
        path: slug,
        component: mdxPageTemplate,
        context: {
          slug: slug,
          id: mdxDocument.node.id,
        },
      });

      // If the project doesnt already have a landing page
      // we create a documentation homepage for it.
      if (slug === '/docs/') {
        createPage({
          path: '/',
          component: mdxPageTemplate,
          context: {
            slug: slug,
            id: mdxDocument.node.id,
          },
        });
      }
    });
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === 'Mdx') {
    let value = createFilePath({ node, getNode });

    const category = node.frontmatter.category;
    const title = node.frontmatter.title;
    if (category) {
      value =
        category.reduce((acc, c) => `${acc}${slugify(c.toLowerCase())}/`, '/') +
        slugify(title.toLowerCase()) +
        '/';
    }

    if (value === '/home/') {
      value = '/';
    }

    createNodeField({
      id: node.id,
      name: `slug`,
      node,
      value: '/docs' + value,
    });
  }
};
