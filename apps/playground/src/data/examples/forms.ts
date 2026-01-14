import formDemo from './forms/form-demo.json';
import airtableForm from './forms/airtable-form.json';

export const forms = {
  'form-demo': JSON.stringify(formDemo, null, 2),
  'airtable-form': JSON.stringify(airtableForm, null, 2)
};
