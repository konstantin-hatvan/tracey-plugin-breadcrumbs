const path = require('path');
const visit = require('unist-util-visit');
const { html, link, paragraph, text } = require('mdast-builder');

const defaultConfiguration = {
    property: 'parent',
    separator: '>',
};

const requirementHasParent = (requirement, configuration) => Object.prototype.hasOwnProperty.call(requirement, configuration.property);

const walkRootline = (current, requirements, configuration) => {
    if (requirementHasParent(current, configuration)) {
        const parent = requirements.find(aRequirement => aRequirement.id === current.parent);
        if (parent) {
            return [
                current,
                ...walkRootline(parent, requirements, configuration),
            ];
        }
    }

    return [ current ];
};

const removeBreadcrumbs = (original) => {
    const requirement = { ...original };

    visit(requirement.ast, 'html', (node, index, parent) => {
        if (node.value === '<div class="tracey tracey-plugin-breadcrumbs">' && parent) {
            parent.children.splice(index, 3);
        }
    });

    return requirement;
};

const createBreadcrumbs = (requirement, parents, configuration) => {
    const updatedParents = parents.map((parent, index) => {
        const relativeLink = path.relative(path.parse(requirement.file).dir, parent.file);
        let output = [ link(relativeLink, parent.id, text(parent.id)) ];

        if (index < parents.length - 1) {
            output.push(text(` ${configuration.separator} `));
        }

        return output;
    }).flat();

    return [
        html('<div class="tracey tracey-plugin-breadcrumbs">'),
        paragraph(updatedParents),
        html('</div>'),
    ];
};

const updateBreadcrumbs = (original, parents, configuration) => {
    const requirement = { ...original };
    const breadcrumbs = createBreadcrumbs(requirement, parents, configuration);
    let shouldAddBreadcrumbsToTop = true;


    visit(requirement.ast, 'html', (node, index, parent) => {
        if (node.value === '<div class="tracey tracey-plugin-breadcrumbs">' && parent) {
            parent.children.splice(index, breadcrumbs.length, ...breadcrumbs);
            shouldAddBreadcrumbsToTop = false;
        }
    });

    if (shouldAddBreadcrumbsToTop) {
        visit(requirement.ast, 'yaml', (node, index, parent) => {
            requirement.ast.children.splice(index + 1, 0, ...breadcrumbs);
        });
    }

    return requirement;
};

const plugin = (configuration = defaultConfiguration) => ({ requirements, annotations, tracelinks }) => {
    const updatedRequirements = requirements.map(theRequirement => {
        const rootline = walkRootline(theRequirement, requirements, configuration);

        if (rootline.length > 1) {
            let [ self, ...parents ] = rootline;
            return updateBreadcrumbs(theRequirement, parents, configuration);
        }

        return removeBreadcrumbs(theRequirement);
    });

    const updatedTracelinks = tracelinks.map(theTracelink => {
        const updatedRequirement = updatedRequirements.find(theRequirement => theRequirement.id === theTracelink.requirement.id);

        return {
            requirement: updatedRequirement,
            annotation: theTracelink.annotation,
        };
    });

    return {
        requirements: updatedRequirements,
        annotations,
        tracelinks: updatedTracelinks,
    };
};

module.exports = {
    plugin,
};
