module.exports = {
  rules: {
    // Custom rule to prevent hardcoded color classes
    'no-hardcoded-colors': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent hardcoded color classes that break dark mode',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          hardcodedColor:
            'Hardcoded color class "{{color}}" detected. Use design system colors instead.',
        },
      },
      create(context) {
        const hardcodedColors = [
          // Gray colors
          'text-gray-900',
          'text-gray-800',
          'text-gray-700',
          'text-gray-600',
          'text-gray-500',
          'text-gray-400',
          'text-gray-300',
          'text-gray-200',
          'text-gray-100',
          'bg-gray-900',
          'bg-gray-800',
          'bg-gray-700',
          'bg-gray-600',
          'bg-gray-500',
          'bg-gray-400',
          'bg-gray-300',
          'bg-gray-200',
          'bg-gray-100',
          'bg-gray-50',
          'border-gray-900',
          'border-gray-800',
          'border-gray-700',
          'border-gray-600',
          'border-gray-500',
          'border-gray-400',
          'border-gray-300',
          'border-gray-200',
          'border-gray-100',

          // Red colors
          'text-red-600',
          'text-red-500',
          'text-red-400',
          'text-red-300',
          'text-red-200',
          'bg-red-50',
          'bg-red-100',
          'bg-red-200',
          'bg-red-300',
          'bg-red-400',
          'border-red-200',
          'border-red-300',
          'border-red-400',
          'border-red-500',
          'border-red-600',

          // Blue colors
          'text-blue-600',
          'text-blue-500',
          'text-blue-400',
          'text-blue-300',
          'text-blue-200',
          'bg-blue-50',
          'bg-blue-100',
          'bg-blue-200',
          'bg-blue-300',
          'bg-blue-400',
          'border-blue-200',
          'border-blue-300',
          'border-blue-400',
          'border-blue-500',
          'border-blue-600',

          // Focus states
          'focus:ring-red-500',
          'focus:border-red-500',
          'focus:ring-blue-500',
          'focus:border-blue-500',

          // Hover states
          'hover:bg-gray-50',
          'hover:bg-gray-100',
          'hover:border-gray-300',
          'hover:text-gray-700',
          'hover:bg-red-50',
          'hover:bg-blue-50',
          'hover:bg-blue-100',
        ];

        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              hardcodedColors.forEach((color) => {
                if (node.value.includes(color)) {
                  context.report({
                    node,
                    messageId: 'hardcodedColor',
                    data: { color },
                    fix(fixer) {
                      // Suggest replacement
                      let replacement = color;
                      if (color.startsWith('text-gray-')) {
                        replacement =
                          color.includes('900') ||
                          color.includes('800') ||
                          color.includes('700')
                            ? 'text-text'
                            : 'text-text-light';
                      } else if (color.startsWith('bg-gray-')) {
                        replacement =
                          color.includes('900') || color.includes('800')
                            ? 'bg-background'
                            : 'bg-surface';
                      } else if (color.startsWith('border-gray-')) {
                        replacement = 'border-border';
                      } else if (color.startsWith('text-red-')) {
                        replacement = 'text-destructive';
                      } else if (color.startsWith('bg-red-')) {
                        replacement = 'bg-destructive/10';
                      } else if (color.startsWith('border-red-')) {
                        replacement = 'border-destructive';
                      } else if (color.startsWith('text-blue-')) {
                        replacement = 'text-primary';
                      } else if (color.startsWith('bg-blue-')) {
                        replacement = 'bg-primary/10';
                      } else if (color.startsWith('border-blue-')) {
                        replacement = 'border-primary';
                      } else if (color.startsWith('focus:ring-red-')) {
                        replacement = 'focus:ring-destructive';
                      } else if (color.startsWith('focus:border-red-')) {
                        replacement = 'focus:border-destructive';
                      } else if (color.startsWith('focus:ring-blue-')) {
                        replacement = 'focus:ring-primary';
                      } else if (color.startsWith('focus:border-blue-')) {
                        replacement = 'focus:border-primary';
                      } else if (color.startsWith('hover:bg-gray-')) {
                        replacement = 'hover:bg-surface';
                      } else if (color.startsWith('hover:border-gray-')) {
                        replacement = 'hover:border-border';
                      } else if (color.startsWith('hover:text-gray-')) {
                        replacement = 'hover:text-text';
                      } else if (color.startsWith('hover:bg-red-')) {
                        replacement = 'hover:bg-destructive/10';
                      } else if (color.startsWith('hover:bg-blue-')) {
                        replacement = 'hover:bg-primary/10';
                      }

                      return fixer.replaceText(
                        node,
                        node.value.replace(color, replacement)
                      );
                    },
                  });
                }
              });
            }
          },
        };
      },
    },
  },
};
