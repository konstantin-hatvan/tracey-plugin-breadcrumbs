# tracey-plugin-breadcrumbs

Generates a breadcrumbs navigation for reqruirements.

## Usage

Link requirements in a parent-child relationship using the frontmatter key `parent`

### Installation

Install the plugin

`npm install tracey-plugin-breadcrumbs --save-dev`

### Tracey configuration

Add the plugin to the project configuration

```js
// tracey.config.js

const BreadcrumbsPlugin = require('tracey-plugin-breadcrumbs');

module.exports = {
    plugins: [
        BreadcrumbsPlugin({ /* configuration options */ }),
    ],
};
```

### Plugin configuration

The configuration object has the following options

#### property

**Default**: `parent`

Use this option to configure the frontmatter key for linking requirements

#### separator

**Default**: `>`

Use this option to configure the breadcrumb separator
