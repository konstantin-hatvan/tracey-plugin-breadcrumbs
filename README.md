# tracey-plugin-breadcrumbs

Generates a breadcrumbs navigation for reqruirements.

## Usage

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
        BreadcrumbsPlugin(),
    ],
};
```
