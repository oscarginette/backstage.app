import { useState, useEffect } from 'react';
import { EmailTemplate } from '../types/dashboard';

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [defaultTemplate, setDefaultTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTemplates(data.templates || []);

      // Find default template
      const defaultTpl = data.templates?.find((t: EmailTemplate) => t.isDefault);
      if (defaultTpl) {
        setDefaultTemplate(defaultTpl);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateById = async (id: string): Promise<EmailTemplate | null> => {
    try {
      const res = await fetch(`/api/templates/${id}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.template || null;
    } catch (err: any) {
      setError(err.message || 'Error loading template');
      return null;
    }
  };

  const createTemplate = async (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate | null> => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reload templates
      await loadTemplates();

      return data.template || null;
    } catch (err: any) {
      setError(err.message || 'Error creating template');
      return null;
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    defaultTemplate,
    loading,
    error,
    loadTemplates,
    getTemplateById,
    createTemplate
  };
}
