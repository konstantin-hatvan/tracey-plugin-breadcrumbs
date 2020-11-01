const path = require('path');
const visit = require('unist-util-visit');
const { html, link, paragraph, text } = require('mdast-builder');

const requirementHasParent = (requirement) => Object.prototype.hasOwnProperty.call(requirement, 'parent');

const walkRootline = (current, requirements) => {
    if (requirementHasParent(current)) {
        const parent = requirements.find(aRequirement => aRequirement.id === current.parent);
        if (parent) {
            return [
                current,
                ...walkRootline(parent, requirements),
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

const createBreadcrumbs = (requirement, parents) => {
    const updatedParents = parents.map((parent, index) => {
        const relativeLink = path.relative(path.parse(requirement.file).dir, parent.file);
        let output = [ link(relativeLink, parent.id, text(parent.id)) ];

        if (index < parents.length - 1) {
            output.push(text(' > '));
        }

        return output;
    }).flat();

    return [
        html('<div class="tracey tracey-plugin-breadcrumbs">'),
        paragraph(updatedParents),
        html('</div>'),
    ];
};

const updateBreadcrumbs = (original, parents) => {
    const requirement = { ...original };
    const breadcrumbs = createBreadcrumbs(requirement, parents);
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

const plugin = (configuration) => ({ requirements, annotations, tracelinks }) => {
    const updatedRequirements = requirements.map(theRequirement => {
        const rootline = walkRootline(theRequirement, requirements);

        if (rootline.length > 1) {
            let [ self, ...parents ] = rootline;
            return updateBreadcrumbs(theRequirement, parents);
        }

        return removeBreadcrumbs(theRequirement);
    });

    const updatedTracelinks = tracelinks.map(theTracelink => {
        const updatedRequirement = updatedRequirements.find(theRequirement => theRequirement.id === theTracelink.destination.id);

        return {
            destination: updatedRequirement,
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
