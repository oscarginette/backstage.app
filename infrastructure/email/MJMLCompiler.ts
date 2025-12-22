import mjml2html from 'mjml';

export interface CompileMJMLInput {
  mjmlContent: object;
}

export interface CompileMJMLOutput {
  html: string;
  errors: Array<{
    line: number;
    message: string;
    tagName: string;
  }>;
}

export class MJMLCompiler {
  compile(input: CompileMJMLInput): CompileMJMLOutput {
    const mjmlString = this.objectToMJMLString(input.mjmlContent);

    const result = mjml2html(mjmlString, {
      validationLevel: 'soft',
      minify: false
    });

    return {
      html: result.html,
      errors: result.errors.map(err => ({
        line: err.line,
        message: err.message,
        tagName: err.tagName
      }))
    };
  }

  private objectToMJMLString(mjmlObject: any): string {
    if (typeof mjmlObject === 'string') {
      return mjmlObject;
    }

    const buildNode = (node: any): string => {
      if (!node.tagName) {
        return '';
      }

      const attrs = node.attributes
        ? Object.entries(node.attributes)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ')
        : '';

      const openTag = attrs
        ? `<${node.tagName} ${attrs}>`
        : `<${node.tagName}>`;

      if (node.children && Array.isArray(node.children)) {
        const childrenHtml = node.children.map(buildNode).join('');
        return `${openTag}${childrenHtml}</${node.tagName}>`;
      }

      if (node.content) {
        return `${openTag}${node.content}</${node.tagName}>`;
      }

      const selfClosingTags = ['mj-spacer', 'mj-divider', 'mj-image'];
      if (selfClosingTags.includes(node.tagName)) {
        return attrs ? `<${node.tagName} ${attrs} />` : `<${node.tagName} />`;
      }

      return `${openTag}</${node.tagName}>`;
    };

    return buildNode(mjmlObject);
  }

  validate(mjmlContent: object): { valid: boolean; errors: string[] } {
    const result = this.compile({ mjmlContent });

    return {
      valid: result.errors.length === 0,
      errors: result.errors.map(err => err.message)
    };
  }
}
